"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSessionAuthHeaders } from "@/lib/authClient";
import { resolveSystemPath } from "@/lib/authRoutes";
import { supabaseClient } from "@/lib/supabaseClient";

type AuthState = {
  loading: boolean;
  authorized: boolean;
  email: string | null;
};

export function useOrgAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    loading: true,
    authorized: false,
    email: null
  });

  const clearServerSessionCookie = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Ignore network failures and continue with local session cleanup.
    }
  }, []);

  const validate = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    let headers: Record<string, string>;
    try {
      headers = await getSessionAuthHeaders({ "Content-Type": "application/json" });
    } catch {
      setState({ loading: false, authorized: false, email: null });
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/auth/authorize", {
      method: "POST",
      headers
    });

    if (response.status === 403) {
      await clearServerSessionCookie();
      await supabaseClient.auth.signOut();
      setState({ loading: false, authorized: false, email: null });
      router.replace("/unauthorized");
      return;
    }

    if (!response.ok) {
      setState({ loading: false, authorized: false, email: null });
      router.replace("/login");
      return;
    }

    const data = (await response.json()) as { email?: string; systemPath?: string };
    setState({ loading: false, authorized: true, email: data.email ?? null });

    const currentPath = window.location.pathname;
    if (currentPath === "/login" || currentPath === "/auth/verify") {
      router.replace(resolveSystemPath(data.systemPath));
    }
  }, [clearServerSessionCookie, router]);

  useEffect(() => {
    void validate();
  }, [validate]);

  const signOut = useCallback(async () => {
    await clearServerSessionCookie();
    await supabaseClient.auth.signOut();
    setState({ loading: false, authorized: false, email: null });
    router.replace("/login");
  }, [clearServerSessionCookie, router]);

  return {
    loading: state.loading,
    authorized: state.authorized,
    email: state.email,
    signOut,
    revalidate: validate
  };
}
