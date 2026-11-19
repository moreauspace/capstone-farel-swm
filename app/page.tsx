import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { homeFor } from "@/lib/labels";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user ? homeFor(session.user.role) : "/login");
}
