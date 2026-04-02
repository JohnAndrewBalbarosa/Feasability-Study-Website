"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import UserErrorPanel from "@/components/UserErrorPanel";
import { supabaseClient } from "@/lib/supabaseClient";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const handle = async () => {
      await supabaseClient.auth.signOut();
    };
    void handle();

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    const redirect = window.setTimeout(() => {
      router.replace("/login?unauthorized=1");
    }, 5000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(redirect);
    };
  }, [router]);

  return (
    <main className="page-shell">
      <UserErrorPanel
        title="Sorry, Unauthorized Account"
        message={`This Google account is not authorized for this organization. You will be redirected to login in ${Math.max(secondsLeft, 0)} second(s).`}
      />
    </main>
  );
}
