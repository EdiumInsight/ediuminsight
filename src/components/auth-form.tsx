"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schemas = {
  login: z.object({ email: z.string().email("Enter a valid email address"), password: z.string().min(8, "Use at least 8 characters") }),
  register: z.object({ fullName: z.string().trim().min(1, "Enter your name"), email: z.string().email("Enter a valid email address"), password: z.string().min(8, "Use at least 8 characters") }),
  forgot: z.object({ email: z.string().email("Enter a valid email address") }),
  reset: z.object({ password: z.string().min(8, "Use at least 8 characters") }),
};

type Mode = keyof typeof schemas;
type FormValues = { email: string; password?: string; fullName?: string };

const copy: Record<Mode, { title: string; description: string; action: string; endpoint: string }> = {
  login: { title: "Welcome back", description: "Sign in to your investment research workspace.", action: "Sign in", endpoint: "login" },
  register: { title: "Create your account", description: "Set up a secure workspace for your research.", action: "Create account", endpoint: "register" },
  forgot: { title: "Reset your password", description: "We will send a secure password reset link to your email.", action: "Send reset link", endpoint: "forgot-password" },
  reset: { title: "Choose a new password", description: "Set a new password for your research workspace.", action: "Update password", endpoint: "update-password" },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const config = copy[mode];
  const form = useForm<FormValues>({ resolver: zodResolver(schemas[mode]) as Resolver<FormValues>, defaultValues: { fullName: "", email: "", password: "" } });

  async function submit(values: FormValues) {
    setFeedback(null);
    const response = await fetch(`/api/auth/${config.endpoint}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { setFeedback({ text: result.error ?? "Something went wrong.", error: true }); return; }
    if (mode === "login") { router.push("/dashboard"); router.refresh(); return; }
    if (mode === "reset") { router.push("/login"); router.refresh(); return; }
    setFeedback({ text: mode === "register" ? "Account created. Check your email to confirm your address before signing in." : "If an account exists for this address, a reset link is on its way.", error: false });
    form.reset({ email: "" });
  }

  return <main className="auth-layout"><section className="auth-panel"><div className="auth-brand"><span className="brand-mark"><span>EI</span></span><span><span className="brand-name">EDIUM INSIGHT</span><span className="brand-tag" style={{ display: "block" }}>INVESTMENT RESEARCH</span></span></div><p className="eyebrow">SECURE WORKSPACE</p><h1 className="page-title" style={{ fontSize: 24 }}>{config.title}</h1><p className="page-subtitle">{config.description}</p>
    <form className="auth-form" onSubmit={form.handleSubmit(submit)}>{mode === "register" && <label className="field-label">Full name<input autoComplete="name" {...form.register("fullName")} />{form.formState.errors.fullName && <span className="negative">{form.formState.errors.fullName.message}</span>}</label>}{mode === "forgot" && <label className="field-label">Email address<input type="email" autoComplete="email" {...form.register("email")} />{form.formState.errors.email && <span className="negative">{form.formState.errors.email.message}</span>}</label>}{mode !== "forgot" && <>{mode !== "reset" && <label className="field-label">Email address<input type="email" autoComplete="email" {...form.register("email")} />{form.formState.errors.email && <span className="negative">{form.formState.errors.email.message}</span>}</label>}<label className="field-label">Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} />{form.formState.errors.password && <span className="negative">{form.formState.errors.password.message}</span>}</label></>}{feedback && <div className={`auth-feedback${feedback.error ? " error" : ""}`} role="status">{feedback.text}</div>}<Button className="button-primary" disabled={form.formState.isSubmitting} type="submit" style={{ width: "100%", minHeight: 40 }}>{form.formState.isSubmitting ? "Please wait..." : config.action}</Button></form>
    <div className="auth-footer">{mode === "login" ? <><Link href="/register">Create account</Link><Link href="/forgot-password">Forgot password?</Link></> : <Link href="/login">Back to sign in</Link>}{mode !== "reset" && <Link href="/dashboard">Public market dashboard</Link>}</div>
  </section></main>;
}