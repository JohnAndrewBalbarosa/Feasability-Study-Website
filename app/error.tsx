"use client";

import { useEffect } from "react";

import UserErrorPanel from "@/components/UserErrorPanel";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application boundary error", error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="page-shell">
          <UserErrorPanel
            title="Something Went Wrong"
            message={
              error.message
                ? `We hit an unexpected issue: ${error.message}`
                : "We hit an unexpected issue. Please try again."
            }
            actionLabel="Retry"
            onAction={reset}
          />
        </main>
      </body>
    </html>
  );
}
