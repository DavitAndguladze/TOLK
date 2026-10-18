"use client";
// Browser side of Better Auth: authClient.signUp.email, authClient.signIn.email, authClient.signOut.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
