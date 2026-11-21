import { redirect } from "next/navigation";
import { currentActor } from "@/lib/session";
import { projectIdForActor } from "@/server/queries";

export default async function OpenProjectPage({ params }: { params: { code: string } }) {
  const actor = await currentActor();
  const id = await projectIdForActor(actor, params.code);
  if (!id) redirect(actor.role === "PELANGGAN" ? "/portal" : "/projects");
  redirect(`/projects/${id}`);
}
