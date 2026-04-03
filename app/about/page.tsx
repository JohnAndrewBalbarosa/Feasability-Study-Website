"use client";

import { useRef } from "react";

import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";

export default function AboutPage() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  return (
    <main ref={pageRef} className="page-shell">
      <section className="hero">
        <h1>About The Developer</h1>
        <p>Built for N.E.W Procurement Intelligence.</p>
        <div className="nav">
          <a href="/">Summary Dashboard</a>
          <a href="/materials">Material Requirements</a>
          <a href="/analytics">Detailed Analytics</a>
          <a href="/logs">Transaction Logs</a>
          <a href="/about">About Developer</a>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Developer Profile</h2>
        <p>
          This product was developed and maintained by <strong>J. Balbarosa</strong>.
        </p>
        <p>
          LinkedIn: <a href="https://www.linkedin.com/in/jbalbarosa/" target="_blank" rel="noreferrer">https://www.linkedin.com/in/jbalbarosa/</a>
        </p>
        <p className="muted" style={{ marginTop: "0.65rem" }}>
          Public profile details can change over time. This page links to the official profile for the most up-to-date information.
        </p>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Product Ownership</h2>
        <p>
          N.E.W Procurement Intelligence is a focused break-even, procurement, and analytics platform designed for practical operational decisions.
        </p>
        <p>
          The development direction emphasizes deterministic calculations, traceable outputs, and organization-controlled access.
        </p>
      </section>
    </main>
  );
}
