"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import UserErrorPanel from "@/components/UserErrorPanel";
import { SYSTEM_HOME_PATH } from "@/lib/authRoutes";
import { getSessionAuthHeaders } from "@/lib/authClient";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    if (params.get("unauthorized") === "1") {
      setNotice("Sorry, this Google account is not authorized. Please use an approved account.");
      return () => {
        cancelled = true;
      };
    }

    const redirectIfAuthorized = async () => {
      try {
        const headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/auth/authorize", {
          method: "POST",
          headers
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as { systemPath?: string };
        router.replace(data.systemPath ?? SYSTEM_HOME_PATH);
      } catch {
        // No active session or token, remain on login page.
      }
    };

    void redirectIfAuthorized();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/verify`;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Could not start Google sign in.";
      if (rawMessage.toLowerCase().includes("provider is not enabled")) {
        setError("Google sign-in is not enabled yet. Please contact the administrator.");
      } else {
        setError(rawMessage);
      }
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Wilson Procurement Intelligence</h1>
        <p>Exclusive access for authorized organization accounts.</p>
      </section>

      <section className="card" style={{ marginTop: "1.25rem", maxWidth: "680px" }}>
        <h2>Sign In</h2>
        <p className="muted">Continue with Google. Unauthorized accounts are blocked automatically.</p>
        <button type="button" onClick={signInWithGoogle} disabled={loading} style={{ maxWidth: "280px", marginTop: "0.8rem" }}>
          {loading ? "Redirecting..." : "Sign In With Google"}
        </button>
      </section>

      {notice ? <UserErrorPanel title="Access Restricted" message={notice} /> : null}

      {error ? (
        <UserErrorPanel title="Google Sign-In Did Not Start" message={`${error} Please try again in a few moments.`} actionLabel="Try Sign-In Again" onAction={signInWithGoogle} />
      ) : null}
    </main>
  );
}
