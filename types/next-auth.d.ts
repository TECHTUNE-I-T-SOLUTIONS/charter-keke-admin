import { NextAuth } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    phone_number: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      phone_number: string;
      firstName?: string;
      lastName?: string;
      profilePictureUrl?: string;
    };
  }

  interface JWT {
    id: string;
    role: string;
    phone_number: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  }
}