import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "invoice.finalized",
  "invoice.payment_action_required",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
  "invoice.paid",
];

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

function upsertEnvValue(text, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;

  if (pattern.test(text)) {
    return text.replace(pattern, line);
  }

  const suffix = text.endsWith("\n") ? "" : "\n";
  return `${text}${suffix}${line}\n`;
}

function hasRealWebhookSecret(value) {
  return Boolean(value && value.startsWith("whsec_") && !value.includes("REPLACE_ME"));
}

async function getEndpointById(stripe, endpointId) {
  try {
    return await stripe.webhookEndpoints.retrieve(endpointId);
  } catch {
    return null;
  }
}

async function createEndpoint(stripe, webhookUrl) {
  return stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: REQUIRED_EVENTS,
    metadata: {
      app: "sellboost",
      managedBy: "scripts/create-stripe-webhook-endpoint.mjs",
    },
    api_version: "2025-08-27.basil",
  });
}

function printSummary(params) {
  const { endpointId, webhookUrl, signingSecret, events, source } = params;
  console.log("Stripe webhook endpoint is ready.");
  console.log(`Source: ${source}`);
  console.log(`Endpoint ID: ${endpointId}`);
  console.log(`Endpoint URL: ${webhookUrl}`);
  console.log(`Signing Secret: ${signingSecret}`);
  console.log("Enabled Events:");
  for (const event of events) {
    console.log(`- ${event}`);
  }
}

async function main() {
  const envFileText = readEnvFile();
  const env = parseEnv(envFileText);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
  const webhookUrl = process.env.STRIPE_WEBHOOK_ENDPOINT_URL || env.STRIPE_WEBHOOK_ENDPOINT_URL;

  if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
    throw new Error("Missing or invalid STRIPE_SECRET_KEY in .env.local.");
  }

  if (!webhookUrl || !/^https?:\/\//.test(webhookUrl)) {
    throw new Error("Missing or invalid STRIPE_WEBHOOK_ENDPOINT_URL in .env.local.");
  }

  const stripe = new Stripe(stripeSecretKey);

  const existingEndpointId = env.STRIPE_WEBHOOK_ENDPOINT_ID;
  const existingSecret = env.STRIPE_WEBHOOK_SECRET;

  let endpoint;
  let signingSecret;
  let source;

  if (existingEndpointId) {
    const existingEndpoint = await getEndpointById(stripe, existingEndpointId);
    if (existingEndpoint && existingEndpoint.url === webhookUrl) {
      endpoint = await stripe.webhookEndpoints.update(existingEndpointId, {
        enabled_events: REQUIRED_EVENTS,
      });

      if (hasRealWebhookSecret(existingSecret)) {
        signingSecret = existingSecret;
        source = "updated-existing-endpoint-using-env-secret";
      } else {
        const created = await createEndpoint(stripe, webhookUrl);
        endpoint = created;
        signingSecret = created.secret;
        source = "created-new-endpoint-because-secret-missing";
      }
    } else {
      const created = await createEndpoint(stripe, webhookUrl);
      endpoint = created;
      signingSecret = created.secret;
      source = "created-new-endpoint-existing-id-invalid-or-url-changed";
    }
  } else {
    const created = await createEndpoint(stripe, webhookUrl);
    endpoint = created;
    signingSecret = created.secret;
    source = "created-new-endpoint";
  }

  if (!signingSecret) {
    throw new Error(
      "Unable to resolve Stripe webhook signing secret. If endpoint already existed, set STRIPE_WEBHOOK_SECRET in .env.local and run again."
    );
  }

  let nextText = envFileText;
  nextText = upsertEnvValue(nextText, "STRIPE_WEBHOOK_ENDPOINT_ID", endpoint.id);
  nextText = upsertEnvValue(nextText, "STRIPE_WEBHOOK_SECRET", signingSecret);
  nextText = upsertEnvValue(
    nextText,
    "STRIPE_WEBHOOK_EVENTS_COVERED",
    `"${REQUIRED_EVENTS.join(",")}"`
  );

  if (nextText !== envFileText) {
    fs.writeFileSync(envPath, nextText, "utf8");
  }

  printSummary({
    endpointId: endpoint.id,
    webhookUrl,
    signingSecret,
    events: REQUIRED_EVENTS,
    source,
  });
}

main().catch((error) => {
  console.error("Failed to create Stripe webhook endpoint:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
