import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Stripe from "stripe";
import { Pool } from "pg";

const ENV_FILENAME = ".env";
const envPath = path.join(process.cwd(), ENV_FILENAME);

function parseEnv(contents) {
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function readEnvFile() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`${ENV_FILENAME} not found at ${envPath}`);
  }
  return fs.readFileSync(envPath, "utf8");
}

function argValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.find((part) => part.startsWith(prefix));
  if (found) {
    return found.slice(prefix.length).trim();
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return process.argv[index + 1]?.trim() ?? "";
  }

  return "";
}

function requireArg(name) {
  const value = argValue(name);
  if (!value) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return value;
}

function toDecimalString(value) {
  return Number(value).toFixed(2);
}

function calculateSplit(amount) {
  const numeric = Number(amount);
  const commission = Number((numeric * 0.12).toFixed(2));
  const ownerAmount = Number((numeric - commission).toFixed(2));
  return {
    amount: toDecimalString(numeric),
    platformCommission: toDecimalString(commission),
    ownerAmount: toDecimalString(ownerAmount),
  };
}

function buildTimeline(existingTimeline, now) {
  const timeline = Array.isArray(existingTimeline) ? [...existingTimeline] : [];
  const paidEntry = {
    key: "paid",
    label: "Paid",
    at: now.toISOString(),
    active: true,
  };
  const paidIndex = timeline.findIndex((item) => item && item.key === "paid");
  if (paidIndex >= 0) {
    timeline[paidIndex] = paidEntry;
  } else {
    timeline.push(paidEntry);
  }
  return timeline;
}

function printUsage() {
  console.log(
    "Usage: node scripts/repair-stripe-subscription-invoice.mjs --yes --session-id <cs_...> --invoice-id <uuid>",
  );
}

async function main() {
  if (!process.argv.includes("--yes")) {
    printUsage();
    throw new Error("Missing confirmation flag. Run this script with --yes.");
  }

  const sessionId = requireArg("--session-id");
  const invoiceId = requireArg("--invoice-id");

  const envFileText = readEnvFile();
  const env = parseEnv(envFileText);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

  if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
    throw new Error("Missing or invalid STRIPE_SECRET_KEY.");
  }

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL.");
  }

  const stripe = new Stripe(stripeSecretKey);
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

    if (!subscriptionId) {
      throw new Error("Stripe session does not include a subscription id.");
    }

    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit: 3,
    });
    const stripeInvoice = invoices.data[0] ?? null;

    if (!stripeInvoice) {
      throw new Error("No Stripe invoice found for subscription.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const invoiceResult = await client.query(
        `select i.id, i."bookingId", i."paymentId", i.status, i."timeline", i."paidAt", i."issuedAt", i."dueAt", i."ownerId", i."renterId", i."totalAmount", i."subtotal", i."platformFee", i."taxAmount", i.currency, i."invoiceNumber", b."ownerId" as "bookingOwnerId", b."renterId" as "bookingRenterId", b.status as "bookingStatus", b."monthlyPrice", b."platformCommission" as "bookingPlatformCommission", b."ownerAmount" as "bookingOwnerAmount" from "Invoice" i join "Booking" b on b.id = i."bookingId" where i.id = $1 for update`,
        [invoiceId],
      );

      if (!invoiceResult.rows[0]) {
        throw new Error(`Invoice ${invoiceId} was not found.`);
      }

      const invoiceRow = invoiceResult.rows[0];
      const bookingId = invoiceRow.bookingId;
      const bookingOwnerId = invoiceRow.bookingOwnerId;
      const now = new Date();
      const split = calculateSplit(invoiceRow.monthlyPrice ?? stripeInvoice.amount_paid / 100);
      const paymentIntentId =
        typeof stripeInvoice.payment_intent === "string"
          ? stripeInvoice.payment_intent
          : stripeInvoice.payment_intent?.id ?? null;
      const stripeCustomerId =
        typeof stripeInvoice.customer === "string"
          ? stripeInvoice.customer
          : stripeInvoice.customer?.id ?? null;
      const chargeId = typeof stripeInvoice.charge === "string" ? stripeInvoice.charge : null;

      if (!invoiceRow.paymentId) {
        const paymentId = crypto.randomUUID();

        await client.query(
          `insert into "Payment" (
            id,
            "bookingId",
            amount,
            currency,
            "platformCommission",
            "ownerAmount",
            status,
            "paidAt",
            "failedAt",
            "refundedAt",
            "stripeCheckoutSessionId",
            "stripePaymentIntentId",
            "stripeCustomerId",
            "stripeChargeId",
            "createdAt",
            "updatedAt"
          ) values (
            $1,$2,$3,$4,$5,$6,$7,$8,null,null,$9,$10,$11,$12,$13,$13
          )`,
          [
            paymentId,
            bookingId,
            split.amount,
            stripeInvoice.currency,
            split.platformCommission,
            split.ownerAmount,
            "PAID",
            now,
            sessionId,
            paymentIntentId,
            stripeCustomerId,
            chargeId,
            now,
          ],
        );

        const nextTimeline = buildTimeline(invoiceRow.timeline, now);

        await client.query(
          `update "Invoice"
           set
             "paymentId" = $2,
             status = $3,
             "paidAt" = $4,
             timeline = $5::json,
             "updatedAt" = $4
           where id = $1`,
          [invoiceId, paymentId, "PAID", now, JSON.stringify(nextTimeline)],
        );

        await client.query(
          `update "OwnerProfile"
           set
             "walletBalance" = "walletBalance" + $2,
             "pendingPayout" = "pendingPayout" + $2,
             "totalEarnings" = "totalEarnings" + $2,
             "updatedAt" = $3
           where id = $1`,
          [bookingOwnerId, split.ownerAmount, now],
        );

        if (invoiceRow.bookingStatus === "APPROVED" || invoiceRow.bookingStatus === "PENDING") {
          await client.query(
            `update "Booking"
             set status = 'ACTIVE', "approvedAt" = coalesce("approvedAt", $2), "updatedAt" = $2
             where id = $1`,
            [bookingId, now],
          );
        }

        console.log(
          JSON.stringify(
            {
              repaired: true,
              invoiceId,
              paymentId,
              bookingId,
              stripeInvoiceId: stripeInvoice.id,
              stripePaymentIntentId: paymentIntentId,
              stripeCheckoutSessionId: sessionId,
              amount: split.amount,
              platformCommission: split.platformCommission,
              ownerAmount: split.ownerAmount,
            },
            null,
            2,
          ),
        );
      } else {
        console.log(
          JSON.stringify(
            {
              repaired: false,
              reason: "Invoice already has a paymentId",
              invoiceId,
              paymentId: invoiceRow.paymentId,
            },
            null,
            2,
          ),
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to repair Stripe subscription invoice:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
