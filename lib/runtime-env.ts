const demoSecret = "satya-wira-demo-7f3c9a1e2b4d6f8091a2b3c4d5e6f7089ab";

if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = demoSecret;
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.DEPLOY_PRIME_URL || process.env.URL || "http://localhost:3000";
}
if (!process.env.DATABASE_URL) process.env.DATABASE_URL = "file:./dev.db";
