"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/platform/auth-client";

const field =
  "mt-1 block min-h-11 w-full rounded-lg border border-hairline bg-white/70 px-3 text-base font-normal text-ink outline-light focus-visible:outline-2";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const creating = mode === "create";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    const { error } = creating
      ? await authClient.signUp.email({ name: String(form.get("name")), email, password })
      : await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Something went wrong. Try again.");
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div role="group" aria-label="Sign in or create account" className="grid grid-cols-2 rounded-lg border border-hairline p-1">
        {(["sign-in", "create"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`min-h-11 rounded-md text-sm font-semibold outline-light focus-visible:outline-2 ${mode === m ? "bg-ink text-mist" : "text-fog"}`}
          >
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {creating && (
        <label className="block text-sm font-semibold">
          Name
          <input name="name" type="text" autoComplete="name" required className={field} />
        </label>
      )}
      <label className="block text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="email" required className={field} />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          minLength={creating ? 8 : undefined}
          required
          className={field}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-light px-4 font-semibold text-white outline-light outline-offset-2 focus-visible:outline-2 disabled:opacity-60"
      >
        {pending ? "One moment…" : creating ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
