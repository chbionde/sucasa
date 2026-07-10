import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Único Route Handler do app: expõe os endpoints HTTP do better-auth
// (/api/auth/sign-in, /sign-up, /sign-out, /get-session, ...).
export const { GET, POST } = toNextJsHandler(auth);
