"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  getDashboardPath,
  normalizeInternalPath,
} from "@/lib/auth-routing";
import { loginSchema } from "@/lib/validations/auth";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [nextPath] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return normalizeInternalPath(
      new URLSearchParams(window.location.search).get("next"),
    );
  });
  const [formState, setFormState] = useState<LoginFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse(formState);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Please check the form fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = (await response.json()) as {
        user?: { role?: "ADMIN" | "OWNER" | "RENTER" };
        error?: string;
      };

      if (!response.ok || !data.user?.role) {
        setErrorMessage(data.error ?? "Unable to log in right now.");
        return;
      }

      const destination =
        nextPath ?? getDashboardPath(data.user.role) ?? "/renter/dashboard";

      router.replace(destination);
      router.refresh();
    } catch {
      setErrorMessage("Unable to log in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface antialiased flex items-center justify-center pt-32 pb-12 px-6">
      <div className="w-full max-w-[1150px] bg-[#F7F7F5] rounded-[24px] shadow-[0_8px_40px_rgba(15,61,62,0.06)] overflow-hidden border border-[#EBEBE8]">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          <aside className="w-full md:w-[40%] bg-secondary-container/30 relative p-8 md:p-12 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-10 grayscale pointer-events-none">
              <img
                alt="A clean, professionally organized high-end storage facility with architectural lighting and polished concrete floors."
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuABaZjB_-aytvUuKveqUINV1YI1WXjyMSJ3dYyiCqOq_D4utxkOrqErgjJmQKWQXrc4IIDv-6PR_mAEE-uZgPAQyHaFlzBj3Aoclm38lS9n9RboAo3gEU6cdOwMw9uUM966NJbfem2kElH7gebXA9hq5WM940SYJ-ewFe1YDSSTzMkbT_cfYWDtTTUy6sfzAyur0zhmOY8nrhc_qtFpHM6WndltIV-bL4_zl5aB9vlEk81-EQLJ2vRh10uqB2QnZ1AZgcZ4E_wnL7U"
              />
            </div>

            <div className="relative z-10">
              <h1 className="font-h2 text-h2 text-primary mb-12">
                Welcome back
              </h1>

              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      verified
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Secure Access
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      Sign in with your encrypted session.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Role Routing
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      You&apos;ll land on the right dashboard instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-on-primary flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-body-md">
                      Protected Session
                    </p>
                    <p className="text-stone-500 text-body-sm">
                      HTTP-only cookies keep the session private.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8">
              <p className="text-xs text-secondary italic opacity-75">
                Access your cave, contracts, and messages securely.
              </p>
            </div>
          </aside>

          <section className="w-full md:w-[60%] p-8 md:p-12 flex flex-col justify-between">
            <div className="max-w-[480px] mx-auto w-full">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <section>
                  <div className="mb-10">
                    <h3 className="font-h1 text-h1 text-primary mb-2">
                      Log in
                    </h3>
                    <p className="font-body-md text-body-md text-stone-500">
                      Continue to your owner, renter, or admin dashboard.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label
                        className="font-label-caps text-label-caps text-on-tertiary-fixed-variant ml-1"
                        htmlFor="email"
                      >
                        EMAIL ADDRESS
                      </label>
                      <input
                        autoComplete="email"
                        className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        id="email"
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        placeholder="name@luxury.com"
                        type="email"
                        value={formState.email}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="font-label-caps text-label-caps text-on-tertiary-fixed-variant ml-1"
                        htmlFor="password"
                      >
                        PASSWORD
                      </label>
                      <input
                        autoComplete="current-password"
                        className="w-full bg-surface-container-low border-none rounded-lg px-5 py-4 font-body-md text-body-md focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                        id="password"
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        type="password"
                        value={formState.password}
                      />
                    </div>

                    {errorMessage ? (
                      <div className="rounded-lg border border-[#cfa7a7] bg-[#fff6f6] px-4 py-3 text-sm text-[#7b2d2d]">
                        {errorMessage}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className="pt-8 flex items-center justify-between gap-4">
                  <Link
                    className="px-8 py-3 rounded-full text-primary font-bold text-sm hover:bg-stone-100 transition-colors flex items-center gap-2"
                    href="/signup"
                  >
                    <span className="material-symbols-outlined text-sm">
                      arrow_back
                    </span>
                    Sign up
                  </Link>

                  <button
                    className="bg-[#0F3D3E] text-on-primary px-10 py-4 rounded-full font-bold text-body-md hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center gap-2 disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? "Signing in..." : "Log in"}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
