#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];
const TARGET_ATTRS = new Set(["alt", "aria-label", "title", "placeholder"]);
const EXCLUDED_ICON_CLASSES = ["material-symbols-outlined"];

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .split(".")
    .filter(Boolean)
    .slice(0, 6)
    .join(".");
}

function stableKey(filePath, kind, value) {
  const rel = path
    .relative(ROOT, filePath)
    .replace(/\\/g, "/")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9/.-]/g, "");
  const prefix = rel
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9]+/g, "."))
    .filter(Boolean)
    .join(".");
  const readable = slugify(value);
  const hash = crypto.createHash("sha1").update(`${rel}|${kind}|${value}`).digest("hex").slice(0, 8);
  return `${prefix}.${kind}.${readable || "text"}.${hash}`;
}

function isHumanText(value, kind) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === "—" || trimmed === "-" || trimmed === "–") return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^[•·\s]+$/.test(trimmed)) return false;
  if (kind === "jsxText" && /^[a-z0-9_]+$/.test(trimmed) && trimmed.length <= 24) {
    return false;
  }

  return true;
}

function isMaterialIconText(node) {
  const parent = node.parent;
  if (!parent || !ts.isJsxElement(parent) && !ts.isJsxSelfClosingElement(parent)) {
    return false;
  }

  const attributes = ts.isJsxElement(parent)
    ? parent.openingElement.attributes.properties
    : parent.attributes.properties;

  return attributes.some((attr) => {
    if (!ts.isJsxAttribute(attr)) return false;
    if (attr.name.text !== "className" && attr.name.text !== "class") return false;
    const init = attr.initializer;
    if (!init) return false;

    const text =
      ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)
        ? init.text
        : ts.isJsxExpression(init) &&
            init.expression &&
            (ts.isStringLiteral(init.expression) || ts.isNoSubstitutionTemplateLiteral(init.expression))
          ? init.expression.text
          : "";

    return EXCLUDED_ICON_CLASSES.some((cls) => text.includes(cls));
  });
}

function isInsideStyleElement(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) {
      const tagName = ts.isJsxElement(current)
        ? current.openingElement.tagName.getText()
        : current.tagName.getText();
      if (tagName === "style") {
        return true;
      }
    }
    current = current.parent;
  }

  return false;
}

function hasTranslator(source) {
  return (
    source.includes("createTranslator(") ||
    source.includes("useTranslation(") ||
    /const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\s*\)/.test(source) ||
    /const\s+t\s*=\s*createTranslator\(/.test(source)
  );
}

function isClientFile(source) {
  return /^\s*["']use client["'];/m.test(source);
}

function hasAsyncDefaultExport(source) {
  return /export\s+default\s+async\s+function\s+[A-Za-z0-9_]+\s*\(/.test(source);
}

function findInsertAfterImports(source) {
  const importRe = /^import[\s\S]*?;\s*$/gm;
  let match;
  let last = -1;
  while ((match = importRe.exec(source))) {
    last = match.index + match[0].length;
  }
  return last;
}

function findDefaultFunctionBodyStart(source) {
  const patterns = [
    /export\s+default\s+async\s+function\s+[A-Za-z0-9_]*\s*\([^)]*\)\s*\{/,
    /export\s+default\s+function\s+[A-Za-z0-9_]*\s*\([^)]*\)\s*\{/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (match) {
      return match.index + match[0].length;
    }
  }

  return -1;
}

function getLiteralText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isJsxExpression(node) && node.expression) {
    const expr = node.expression;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.text;
    }
  }

  return null;
}

function collectReplacements(sourceFile) {
  const replacements = [];

  function visit(node) {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      const trimmed = raw.trim();
      if (trimmed && isHumanText(trimmed, "jsxText") && !isMaterialIconText(node) && !isInsideStyleElement(node)) {
        const leading = raw.match(/^\s*/)?.[0] ?? "";
        const trailing = raw.match(/\s*$/)?.[0] ?? "";
        const key = stableKey(sourceFile.fileName, "text", trimmed);
        replacements.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: `${leading}{t(${JSON.stringify(key)})}${trailing}`,
          kind: "text",
          value: trimmed,
        });
      }
    }

    if (ts.isJsxAttribute(node) && TARGET_ATTRS.has(node.name.text) && node.initializer) {
      const value = getLiteralText(node.initializer);
      if (value && isHumanText(value, node.name.text)) {
        const key = stableKey(sourceFile.fileName, node.name.text, value);
        replacements.push({
          start: node.initializer.getStart(sourceFile),
          end: node.initializer.getEnd(),
          text: `{t(${JSON.stringify(key)})}`,
          kind: node.name.text,
          value,
        });
      }
    }

    if (ts.isJsxExpression(node) && node.expression && !isInsideStyleElement(node)) {
      const value = getLiteralText(node.expression);
      if (value && isHumanText(value, "jsxExpression")) {
        const key = stableKey(sourceFile.fileName, "expr", value);
        replacements.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: `{t(${JSON.stringify(key)})}`,
          kind: "expr",
          value,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return replacements.sort((a, b) => b.start - a.start);
}

function applyReplacements(source, replacements) {
  let output = source;
  for (const replacement of replacements) {
    output =
      output.slice(0, replacement.start) +
      replacement.text +
      output.slice(replacement.end);
  }
  return output;
}

function ensureClientTranslation(source) {
  if (!isClientFile(source)) return source;

  let updated = source;
  if (!updated.includes('import { useTranslation } from "react-i18next";')) {
    const insertAt = findInsertAfterImports(updated);
    const line = 'import { useTranslation } from "react-i18next";\n';
    if (insertAt >= 0) {
      updated = `${updated.slice(0, insertAt)}${line}${updated.slice(insertAt)}`;
    } else {
      updated = `${line}${updated}`;
    }
  }

  if (!/const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\s*\)/.test(updated)) {
    const insertAt = findDefaultFunctionBodyStart(updated);
    if (insertAt > 0) {
      updated = `${updated.slice(0, insertAt)}\n  const { t } = useTranslation();${updated.slice(insertAt)}`;
    }
  }

  return updated;
}

function ensureServerTranslation(source) {
  if (isClientFile(source)) return source;

  let updated = source;
  if (!updated.includes('import { createTranslator } from "@/lib/i18n";')) {
    const insertAt = findInsertAfterImports(updated);
    const line = 'import { createTranslator } from "@/lib/i18n";\n';
    if (insertAt >= 0) {
      updated = `${updated.slice(0, insertAt)}${line}${updated.slice(insertAt)}`;
    } else {
      updated = `${line}${updated}`;
    }
  }

  if (!updated.includes('import { getServerLocale } from "@/lib/i18n.server";')) {
    const insertAt = findInsertAfterImports(updated);
    const line = 'import { getServerLocale } from "@/lib/i18n.server";\n';
    if (insertAt >= 0) {
      updated = `${updated.slice(0, insertAt)}${line}${updated.slice(insertAt)}`;
    } else {
      updated = `${line}${updated}`;
    }
  }

  if (!/const\s+t\s*=\s*createTranslator\(/.test(updated)) {
    const insertAt = findDefaultFunctionBodyStart(updated);
    if (insertAt > 0) {
      updated = `${updated.slice(0, insertAt)}\n  const t = createTranslator(await getServerLocale());${updated.slice(insertAt)}`;
    }
  }

  return updated;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && /\.(tsx|jsx)$/.test(full)) {
      files.push(full);
    }
  }

  return files;
}

async function processFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const replacements = collectReplacements(sourceFile);

  if (!replacements.length) {
    return null;
  }

  const hadTranslator = hasTranslator(source);
  const canAutoTranslate = isClientFile(source) || (!isClientFile(source) && hasAsyncDefaultExport(source));

  if (!hadTranslator && !canAutoTranslate) {
    return {
      filePath,
      replacements: replacements.length,
      wrote: false,
      needsManualReview: true,
    };
  }

  let updated = applyReplacements(source, replacements);

  if (!hadTranslator) {
    if (isClientFile(source)) {
      updated = ensureClientTranslation(updated);
    } else if (!isClientFile(source) && hasAsyncDefaultExport(source)) {
      updated = ensureServerTranslation(updated);
    }
  }

  if (updated === source) {
    return null;
  }

  if (writeMode) {
    await fs.writeFile(filePath, updated);
  }

  return {
    filePath,
    replacements: replacements.length,
    wrote: writeMode,
    needsManualReview:
      !hadTranslator && !isClientFile(source) && !hasAsyncDefaultExport(source),
  };
}

async function main() {
  const allFiles = [];
  for (const dir of TARGET_DIRS) {
    const full = path.join(ROOT, dir);
    try {
      allFiles.push(...(await walk(full)));
    } catch {
      // Ignore missing target directories.
    }
  }

  const results = [];
  for (const file of allFiles) {
    const result = await processFile(file);
    if (result) results.push(result);
  }

  if (!results.length) {
    console.log("No translatable TSX text found.");
    return;
  }

  for (const result of results) {
    console.log(
      `${writeMode ? "updated" : "would update"} ${path.relative(ROOT, result.filePath)} (${result.replacements} replacements)`,
    );
  }

  const manual = results.filter((result) => result.needsManualReview);
  if (manual.length) {
    console.log("\nFiles that may need a manual translator check:");
    for (const result of manual) {
      console.log(`- ${path.relative(ROOT, result.filePath)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
