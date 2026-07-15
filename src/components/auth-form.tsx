"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type ActionState } from "@/app/actions";

function LoginButton() {
  const { pending } = useFormStatus();
  return <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in to dashboard"}</button>;
}

export function LoginForm() {
  const [state, action] = useActionState(login, {} as ActionState);
  return <form action={action} className="grid gap-5"><label className="label">Email<input className="input" type="email" name="email" autoComplete="email" required /></label><label className="label">Password<input className="input" type="password" name="password" autoComplete="current-password" required /></label>{state.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}<LoginButton /></form>;
}
