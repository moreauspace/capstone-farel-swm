import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { currentActor } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  return (
    <Shell user={{ name: actor.name, email: "", role: actor.role, department: "" }}>
      {children}
    </Shell>
  );
}
