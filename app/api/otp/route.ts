import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";
import { passwordSchema } from "@/lib/password";

export const runtime = "nodejs";

const emailSchema = z.object({ email: z.string().email("Email tidak valid.") });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Email tidak valid." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return NextResponse.json(
      { ok: false, message: "Email tidak terdaftar atau akun nonaktif." },
      { status: 404 },
    );
  }
  const recent = await prisma.otpToken.findFirst({
    where: { userId: user.id, consumed: false, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent) {
    return NextResponse.json(
      { ok: false, message: "Tunggu sebentar sebelum mengirim ulang kode." },
      { status: 429 },
    );
  }
  await prisma.otpToken.updateMany({ where: { userId: user.id, consumed: false }, data: { consumed: true } });
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.otpToken.create({
    data: { userId: user.id, codeHash: await bcrypt.hash(code, 10), expiresAt },
  });
  try {
    const sent = await sendOtpEmail(user.email, user.name, code);
    if (!sent.delivered) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { ok: false, message: "Pengiriman email belum dikonfigurasi." },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString(), devCode: code });
    }
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gagal mengirim email. Periksa konfigurasi SMTP." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/, "Kode harus 6 digit.") })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ ok: false, message: "Kode tidak berlaku." }, { status: 400 });
  const token = await prisma.otpToken.findFirst({
    where: { userId: user.id, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return NextResponse.json({ ok: false, message: "Kode tidak ditemukan. Kirim ulang." }, { status: 400 });
  if (token.expiresAt.getTime() < Date.now() || token.attempts >= 5) {
    await prisma.otpToken.update({ where: { id: token.id }, data: { consumed: true } });
    return NextResponse.json({ ok: false, message: "Kode kedaluwarsa. Kirim ulang." }, { status: 400 });
  }
  const match = await bcrypt.compare(parsed.data.code, token.codeHash);
  if (!match) {
    const attempts = token.attempts + 1;
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts, consumed: attempts >= 5 },
    });
    const left = Math.max(0, 5 - attempts);
    return NextResponse.json(
      { ok: false, message: left ? `Kode salah. Sisa ${left} percobaan.` : "Kode dibatalkan. Kirim ulang." },
      { status: 400 },
    );
  }
  const resetToken = randomBytes(32).toString("hex");
  await prisma.otpToken.update({
    where: { id: token.id },
    data: {
      consumed: true,
      resetTokenHash: createHash("sha256").update(resetToken).digest("hex"),
      resetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return NextResponse.json({ ok: true, resetToken });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = z.object({ resetToken: z.string().min(20), password: passwordSchema }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
  }
  const hash = createHash("sha256").update(parsed.data.resetToken).digest("hex");
  const token = await prisma.otpToken.findFirst({
    where: { resetTokenHash: hash, resetExpiresAt: { gt: new Date() } },
  });
  if (!token) {
    return NextResponse.json({ ok: false, message: "Sesi pemulihan berakhir. Ulangi dari awal." }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: token.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });
  await prisma.otpToken.update({
    where: { id: token.id },
    data: { resetTokenHash: null, resetExpiresAt: null },
  });
  return NextResponse.json({ ok: true, message: "Kata sandi diperbarui." });
}
