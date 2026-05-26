import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

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

function removeEnvKeys(text, keys) {
  let nextText = text;

  for (const key of keys) {
    const pattern = new RegExp(`^${key}=.*\\n?`, "m");
    nextText = nextText.replace(pattern, "");
  }

  return nextText.replace(/\n{3,}/g, "\n\n");
}

async function listAllWebhookEndpoints(stripe) {
  const endpoints = [];
  let startingAfter = undefined;

  while (true) {
    const page = await stripe.webhookEndpoints.list({
      limit: 100,
      starting_after: startingAfter,
    });

    endpoints.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1].id;
  }

  return endpoints;
}

function printUsage() {
  console.log("Usage: node scripts/delete-stripe-webhook-endpoints.mjs --yes");
  console.log("Deletes all Stripe webhook endpoints for the configured STRIPE_SECRET_KEY.");
}

async function main() {
  if (!process.argv.includes("--yes")) {
    printUsage();
    throw new Error("Missing confirmation flag. Run this script with --yes.");
  }

  const envFileText = readEnvFile();
  const env = parseEnv(envFileText);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
    throw new Error("Missing or invalid STRIPE_SECRET_KEY in .env.");
  }

  const stripe = new Stripe(stripeSecretKey);
  const endpoints = await listAllWebhookEndpoints(stripe);

  if (endpoints.length === 0) {
    console.log("No Stripe webhook endpoints found.");
  } else {
    for (const endpoint of endpoints) {
      await stripe.webhookEndpoints.del(endpoint.id);
      console.log(`Deleted webhook endpoint ${endpoint.id} (${endpoint.url})`);
    }
    console.log(`Deleted ${endpoints.length} webhook endpoint(s).`);
  }

  const nextText = removeEnvKeys(envFileText, [
    "STRIPE_WEBHOOK_ENDPOINT_ID",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_WEBHOOK_EVENTS_COVERED",
  ]);

  if (nextText !== envFileText) {
    fs.writeFileSync(envPath, nextText.endsWith("\n") ? nextText : `${nextText}\n`, "utf8");
    console.log("Cleared Stripe webhook env values from .env.");
  }
}

main().catch((error) => {
  console.error("Failed to delete Stripe webhook endpoints:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
