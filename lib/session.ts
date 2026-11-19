import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Actor } from "@/lib/types";

export async function currentActor(): Promise<Actor> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "Pengguna",
    role: session.user.role,
    customerId: session.user.customerId ?? null,
  };
}

export async function requireUser(): Promise<Actor> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Sesi berakhir. Masuk kembali.");
  }
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "Pengguna",
    role: session.user.role,
    customerId: session.user.customerId ?? null,
  };
}
