"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resolveSystemPath } from "@/lib/authRoutes";
import { getSessionAuthHeaders } from "@/lib/authClient";
import { supabaseClient } from "@/lib/supabaseClient";

function AuthVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verify = async () => {
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login");
          return;
        }
      }

      let headers: Record<string, string>;
      try {
        headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
      } catch {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/auth/authorize", {
        method: "POST",
        headers
      });

      if (response.status === 403) {
        await supabaseClient.auth.signOut();
        router.replace("/unauthorized");
        return;
      }

      if (!response.ok) {
        router.replace("/login");
        return;
      }

      const data = (await response.json()) as { systemPath?: string };
      router.replace(resolveSystemPath(data.systemPath));
    };

    void verify();
  }, [router, searchParams]);

  return (
    <main className="page-shell">
      <section className="card" style={{ marginTop: "1.25rem" }}>
        <h2>Verifying account access...</h2>
        <p className="muted">Please wait while we complete sign in.</p>
      </section>
    </main>
  );
}

export default function AuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <section className="card" style={{ marginTop: "1.25rem" }}>
            <h2>Verifying account access...</h2>
          </section>
        </main>
      }
    >
      <AuthVerifyContent />
    </Suspense>
  );
}
