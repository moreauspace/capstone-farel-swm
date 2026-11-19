import { redirect } from "next/navigation";
import { NewProjectForm } from "@/components/new-project-form";
import { currentActor } from "@/lib/session";
import { getCustomers } from "@/server/queries";

export const metadata = { title: "PO baru" };

export default async function NewProjectPage() {
  const actor = await currentActor();
  if (!["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role)) redirect("/projects");
  const customers = await getCustomers();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl tracking-tight">Catat purchase order</h1>
      <p className="mb-5 mt-2 text-sm leading-6 text-muted">
        Simpan sebagai draft bila data masih dilengkapi, atau ajukan langsung agar direktur meninjau rencana pelaksanaan.
      </p>
      <NewProjectForm customers={customers} />
    </div>
  );
}
