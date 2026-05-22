"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <button
      aria-label="Sign out"
      className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-60"
      type="button"
      disabled={isSigningOut}
      onClick={() => {
        void handleSignOut();
      }}
    >
      <span className="material-symbols-outlined text-xl">
        {isSigningOut ? "progress_activity" : "logout"}
      </span>
    </button>
  );
}
