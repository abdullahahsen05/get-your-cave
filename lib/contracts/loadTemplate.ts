import fs from "node:fs/promises";
import path from "node:path";

import type { ContractType } from "@prisma/client";

import { CONTRACT_TEMPLATE_FILE_NAMES } from "@/lib/contracts/contractTypes";

const DOCS_ROOT = path.resolve(process.cwd(), "docs");
const ORIGINAL_DIR = path.join(DOCS_ROOT, "original");
const TEMPLATE_DIR = path.join(DOCS_ROOT, "templates");
const GENERATED_DIR = path.join(DOCS_ROOT, "generated");

export function resolveSafeDocsPath(baseDir: string, unsafePath: string) {
  const resolved = path.resolve(baseDir, unsafePath);
  const relative = path.relative(baseDir, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return resolved;
}

export function getDefaultTemplatePath(contractType: ContractType) {
  return path.join(TEMPLATE_DIR, CONTRACT_TEMPLATE_FILE_NAMES[contractType]);
}

export async function ensureContractDirectories() {
  await Promise.all([
    fs.mkdir(ORIGINAL_DIR, { recursive: true }),
    fs.mkdir(TEMPLATE_DIR, { recursive: true }),
    fs.mkdir(GENERATED_DIR, { recursive: true }),
  ]);

  return {
    originalDir: ORIGINAL_DIR,
    templateDir: TEMPLATE_DIR,
    generatedDir: GENERATED_DIR,
  };
}

export async function readTemplateFile(templatePath: string) {
  return fs.readFile(templatePath);
}

export function getGeneratedContractsDir() {
  return GENERATED_DIR;
}

export function getTemplatesDir() {
  return TEMPLATE_DIR;
}

export function getOriginalDocsDir() {
  return ORIGINAL_DIR;
}

