import {
  containsBlockedLanguage,
  normalizeMessageContent,
  validateMessageContent,
} from "@/lib/content-filter";

const allowedMessages = [
  "Hi, is this storage unit available?",
  "Can I visit tomorrow?",
  "Is there 24/7 access?",
  "Can I store furniture here?",
  "What is the monthly price?",
];

const blockedMessages = [
  "fuck",
  "f u c k",
  "f.u.c.k",
  "fuuuck",
  "sh1t",
  "b@tch",
  "wtf",
  "shut the fuck up",
];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  for (const message of allowedMessages) {
    const result = validateMessageContent(message);
    assert(result.ok, `Expected allowed message to pass: ${message}`);
    assert(
      !containsBlockedLanguage(message),
      `Expected allowed message to stay clean: ${message}`,
    );
  }

  for (const message of blockedMessages) {
    const result = validateMessageContent(message);
    assert(!result.ok, `Expected blocked message to fail: ${message}`);
    assert(
      containsBlockedLanguage(message),
      `Expected blocked message to be detected: ${message}`,
    );
  }

  const preview = normalizeMessageContent("F.u.c.k off.");
  assert(
    preview === "f u c k off",
    `Unexpected normalization preview: ${preview}`,
  );

  console.log("Content filter checks passed.");
  console.log(`Allowed cases: ${allowedMessages.length}`);
  console.log(`Blocked cases: ${blockedMessages.length}`);
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
