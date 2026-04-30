"use client";

import { useRef } from "react";

import PageTopBar from "@/components/PageTopBar";
import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";

export default function AboutPage() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  return (
    <>
      <PageTopBar />
      <main ref={pageRef} className="page-shell">
        <div className="page-heading">
          <h1>About This Project</h1>
          <p className="page-heading__desc">N.E.W Procurement Intelligence — a private business analysis tool built for N.E.W organization staff.</p>
        </div>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>What This System Does</h2>
          <p>
            An 8-step daily workflow tool that calculates break-even, generates AI-assisted demand forecasts, and produces
            procurement and production recommendations — all in one place.
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            Only finalized records are saved. Every save and delete is audit-logged. Access is restricted to authorized
            Google accounts.
          </p>
          <p className="muted" style={{ fontFamily: "monospace", fontSize: "0.88rem", lineHeight: "1.8", marginTop: "0.75rem" }}>
            Break-even (client) → AI Forecast → Procurement Engine → Production Engine → Save → Audit Log
          </p>
          <p style={{ marginTop: "0.75rem" }}>
            <a href="/guide">Not technical? Read the plain-language guide →</a>
          </p>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Tech Stack</h2>
          <ul className="tech-stack-list">
            <li className="tech-pill">Next.js 14</li>
            <li className="tech-pill">TypeScript</li>
            <li className="tech-pill">React 18</li>
            <li className="tech-pill">Supabase</li>
            <li className="tech-pill">GSAP</li>
            <li className="tech-pill">Vercel</li>
          </ul>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Developer</h2>
          <p>
            Built and maintained by <strong>J. Balbarosa</strong>.
          </p>
          <p style={{ marginTop: "0.4rem" }}>
            <a href="https://www.linkedin.com/in/jbalbarosa/" target="_blank" rel="noreferrer">
              linkedin.com/in/jbalbarosa
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
