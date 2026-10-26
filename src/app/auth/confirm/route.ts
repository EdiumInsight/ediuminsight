import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type");
  const nextPath = request.nextUrl.searchParams.get("next");
  const next = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  const client = await createSupabaseServerClient();
  if (!client || (!tokenHash && !code)) return NextResponse.redirect(new URL("/login?error=invalid-link", request.url));

  const { error } = tokenHash && type
    ? await client.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "recovery" | "invite" | "magiclink" | "email" | "email_change" })
    : await client.auth.exchangeCodeForSession(code!);
  if (error) return NextResponse.redirect(new URL("/login?error=invalid-link", request.url));
  return NextResponse.redirect(new URL(next, request.url));
}