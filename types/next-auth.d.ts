import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      customerId: string | null;
      department: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    customerId: string | null;
    department: string;
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    customerId: string | null;
    department: string;
  }
}
