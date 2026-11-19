import nodemailer from "nodemailer";

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendOtpEmail(to: string, name: string, code: string) {
  if (!smtpConfigured()) return { delivered: false as const };
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "PT Satya Wira Mandiri <noreply@satyawira.co.id>",
    to,
    subject: `${code} adalah kode pemulihan Satya Wira`,
    text: `Halo ${name},\n\nKode OTP Anda: ${code}\nBerlaku 5 menit. Jangan teruskan kode ini.\n\nPT Satya Wira Mandiri`,
    html: otpHtml(name, code),
  });
  return { delivered: true as const };
}

function otpHtml(name: string, code: string) {
  const digits = code.split("").map((d) => `<td style="width:44px;height:52px;text-align:center;font-size:24px;font-weight:700;letter-spacing:0;color:#16324a;background:#f7f4ef;border:1px solid #e4d9cc;border-radius:8px;">${d}</td>`).join(`<td style="width:8px"></td>`);
  return `<!doctype html><html><body style="margin:0;background:#efeae2;font-family:Arial,sans-serif;color:#1a2330;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#efeae2;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="460" cellspacing="0" cellpadding="0" style="background:#fffdf8;border:1px solid #e4d9cc;border-radius:12px;overflow:hidden;">
      <tr><td style="background:#102433;padding:22px 28px;color:#f4efe6;">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#e0b08a;">PT Satya Wira Mandiri</div>
        <div style="font-size:20px;margin-top:6px;">Pemulihan kata sandi</div>
      </td></tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 12px;">Halo ${escapeHtml(name)},</p>
        <p style="margin:0 0 18px;line-height:1.5;">Gunakan kode berikut untuk membuat kata sandi baru. Kode berlaku <strong>5 menit</strong> dan hanya bisa dipakai sekali.</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px;"><tr>${digits}</tr></table>
        <p style="margin:0;color:#5c6772;font-size:13px;line-height:1.5;">Jika Anda tidak meminta pemulihan, abaikan email ini. Kata sandi lama tetap aktif.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
}
