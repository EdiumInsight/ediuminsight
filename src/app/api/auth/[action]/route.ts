import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) });
const registration = credentials.extend({ fullName: z.string().trim().min(1).max(100) });

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (action === "login") {
    const parsed = credentials.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Enter a valid email and password of at least 8 characters" }, { status: 400 });
    const { error } = await client.auth.signInWithPassword(parsed.data);
    return error ? Response.json({ error: "Unable to sign in with those credentials" }, { status: 401 }) : Response.json({ data: { authenticated: true } });
  }
  if (action === "register") {
    const parsed = registration.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Enter a name, valid email, and password of at least 8 characters" }, { status: 400 });
    const { error } = await client.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { full_name: parsed.data.fullName } } });
    return error ? Response.json({ error: "Unable to create account" }, { status: 400 }) : Response.json({ data: { confirmationRequired: true } }, { status: 201 });
  }
  if (action === "forgot-password") {
    const parsed = z.object({ email: z.string().email().max(254) }).safeParse(body);
    if (!parsed.success) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    const { error } = await client.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${new URL(request.url).origin}/auth/confirm?next=/reset-password` });
    return error ? Response.json({ error: "Unable to send password reset email" }, { status: 400 }) : Response.json({ data: { sent: true } });
  }
  if (action === "update-password") {
    const parsed = z.object({ password: z.string().min(8).max(128) }).safeParse(body);
    if (!parsed.success) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return Response.json({ error: "Password reset session is invalid or expired" }, { status: 401 });
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    return error ? Response.json({ error: "Unable to update password" }, { status: 400 }) : Response.json({ data: { updated: true } });
  }
  if (action === "logout") {
    const { error } = await client.auth.signOut();
    return error ? Response.json({ error: "Unable to sign out" }, { status: 400 }) : Response.json({ data: { signedOut: true } });
  }
  return Response.json({ error: "Unknown authentication action" }, { status: 404 });
}