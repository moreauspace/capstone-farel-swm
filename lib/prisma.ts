import "./runtime-env";
import fs from "fs";
import os from "os";
import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function onServerless() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
}

function fileUrl(filePath: string) {
  return `file:${filePath.replace(/\\/g, "/")}`;
}

function findDatabase() {
  const direct = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
  ];
  const found = direct.find((file) => fs.existsSync(file));
  if (found) return found;

  const skip = new Set(["node_modules", ".git"]);
  const walk = (dir: string, depth: number): string | undefined => {
    if (depth > 5) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "dev.db") return path.join(dir, entry.name);
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || skip.has(entry.name)) continue;
      const nested = walk(path.join(dir, entry.name), depth + 1);
      if (nested) return nested;
    }
  };
  return walk(process.cwd(), 0);
}

function databaseUrl() {
  const configured = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!configured.startsWith("file:") || !onServerless()) return configured;
  const source = findDatabase();
  if (!source) {
    throw new Error("Database demo tidak ada di paket Netlify. Jalankan ulang deploy.");
  }
  const dest = path.join(os.tmpdir(), "satya-wira.db");
  if (!fs.existsSync(dest)) fs.copyFileSync(source, dest);
  return fileUrl(dest);
}

const log = process.env.NODE_ENV === "development" ? ["error" as const, "warn" as const] : ["error" as const];

function createClient() {
  if (!onServerless()) return new PrismaClient({ log });
  const url = databaseUrl();
  process.env.DATABASE_URL = url;
  return new PrismaClient({ datasources: { db: { url } }, log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
