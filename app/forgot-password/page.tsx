import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ForgotForm } from "@/components/forgot-form";
import { authOptions } from "@/lib/auth";
import { homeFor } from "@/lib/labels";

export const metadata = { title: "Pulihkan akses" };

export default async function ForgotPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(homeFor(session.user.role));
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
      <p className="text-[12px] uppercase tracking-[0.14em] text-copper">PT Satya Wira Mandiri</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Pulihkan akses akun</h1>
      <p className="mb-6 mt-2 text-sm leading-6 text-muted">
        Kode 6 digit dikirim ke email terdaftar dan berlaku 5 menit. Setelah kode benar, buat kata sandi baru.
      </p>
      <ForgotForm />
    </main>
  );
}
