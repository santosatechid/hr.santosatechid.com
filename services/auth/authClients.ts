import { adminClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin by default: the auth handler lives in this app, so the
  // browser must talk to the host it is actually served from.
  baseURL:
    typeof window === "undefined" ? process.env.BETTER_AUTH_URL : undefined,
  plugins: [adminClient(), emailOTPClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
