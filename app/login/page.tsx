import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Mark } from "@/components/brand";
import { LoginForm, DEMO_PASSWORD } from "@/components/login-form";
import { authOptions } from "@/lib/auth";
import { homeFor } from "@/lib/labels";

const LANES = ["Admin proyek", "Direktur", "Gudang", "Produksi", "QC", "Instalasi", "Pelanggan"];

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(homeFor(session.user.role));
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden flex-col justify-between bg-[#102433] px-12 py-10 text-[#e7eef5] lg:flex">
        <div className="flex items-center gap-3">
          <Mark className="size-10 text-[#d7e4f1]" />
          <div>
            <p className="font-display text-3xl leading-none text-white">Satya Wira</p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-[#9eb0c2]">Mandiri</p>
          </div>
        </div>
        <div>
          <h1 className="max-w-md font-display text-5xl leading-[1.05] tracking-tight text-white">
            Pintu timbal, dari PO sampai BAST.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#c5d3e0]">
            Setiap peran hanya melihat tindakan yang sedang berada di mejanya. Produksi berjalan per batch, mengikuti material yang benar-benar ada di gudang.
          </p>
          <ol className="mt-8 space-y-2">
            {LANES.map((lane, index) => (
              <li key={lane} className="flex items-center gap-3 text-sm">
                <span className="num w-6 text-[#e0b08a]">0{index + 1}</span>
                {lane}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-[12px] text-[#9eb0c2]">Kawasan Industri Jababeka II, Cikarang · kata sandi demo {DEMO_PASSWORD}</p>
      </section>
      <section className="flex items-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[12px] uppercase tracking-[0.14em] text-muted lg:hidden">PT Satya Wira Mandiri</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight">Masuk ke ruang operasional</h2>
          <p className="mb-6 mt-2 text-sm text-muted">Gunakan email dinas. Akun demo di bawah memakai sandi yang sama.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
