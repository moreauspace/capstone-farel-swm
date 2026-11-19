import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim() ?? "";
        const password = credentials?.password?.toString() ?? "";
        const remember = credentials?.remember === "true";
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customerId,
          department: user.department,
          remember,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & {
          role: string;
          customerId: string | null;
          department: string;
          remember?: boolean;
        };
        token.id = u.id;
        token.role = u.role;
        token.customerId = u.customerId ?? null;
        token.department = u.department;
        const maxAge = u.remember ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.customerId = token.customerId ?? null;
      session.user.department = token.department;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
