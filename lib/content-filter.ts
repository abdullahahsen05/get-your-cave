const BLOCKED_LANGUAGE_ERROR =
  "Your message contains inappropriate language. Please edit it and try again.";

const BLOCKED_WORDS = [
  "fuck",
  "fucking",
  "fucked",
  "shit",
  "bullshit",
  "bitch",
  "bastard",
  "asshole",
  "dickhead",
  "prick",
  "cunt",
  "twat",
  "wanker",
  "douchebag",
  "slut",
  "whore",
  "idiot",
  "moron",
  "stupid",
  "dumbass",
  "loser",
  "wtf",
  "stfu",
] as const;

const BLOCKED_PHRASES = [
  "fuck off",
  "shut up",
  "go to hell",
  "kill yourself",
  "go kill yourself",
  "shut the fuck up",
] as const;

function stripDiacritics(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

function squashRepeatedCharacters(value: string) {
  return value.replace(/(.)\1+/g, "$1");
}

function normalizeForMatching(
  input: string,
  replacements: { at: string; star: string },
) {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[@]/g, replacements.at)
    .replace(/[*]/g, replacements.star)
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[8]/g, "b")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMatchVariants(input: string) {
  const variants = [
    normalizeForMatching(input, { at: "a", star: "" }),
    normalizeForMatching(input, { at: "u", star: "u" }),
    normalizeForMatching(input, { at: "i", star: "i" }),
  ];

  return variants.filter(Boolean);
}

export function normalizeMessageContent(input: string): string {
  return normalizeForMatching(input, { at: "a", star: "" });
}

export function containsBlockedLanguage(input: string): boolean {
  const variants = buildMatchVariants(input);

  for (const variant of variants) {
    const compact = variant.replace(/\s+/g, "");
    const compactSquashed = squashRepeatedCharacters(compact);
    const tokens = variant.split(" ").filter(Boolean);

    for (const blockedWord of BLOCKED_WORDS) {
      const squashedBlockedWord = squashRepeatedCharacters(blockedWord);

      if (
        tokens.includes(blockedWord) ||
        tokens.includes(squashedBlockedWord) ||
        compact.includes(blockedWord) ||
        compactSquashed.includes(blockedWord) ||
        compact.includes(squashedBlockedWord) ||
        compactSquashed.includes(squashedBlockedWord)
      ) {
        return true;
      }
    }

    for (const blockedPhrase of BLOCKED_PHRASES) {
      if (variant.includes(blockedPhrase)) {
        return true;
      }
    }
  }

  return false;
}

export function validateMessageContent(input: string): {
  ok: boolean;
  reason?: string;
} {
  if (containsBlockedLanguage(input)) {
    return {
      ok: false,
      reason: BLOCKED_LANGUAGE_ERROR,
    };
  }

  return { ok: true };
}

export { BLOCKED_LANGUAGE_ERROR };
