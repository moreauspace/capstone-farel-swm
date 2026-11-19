import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);
  return NextResponse.json({
    unread,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      href: item.href,
      read: item.read,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
