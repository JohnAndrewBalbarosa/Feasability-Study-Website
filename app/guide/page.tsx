"use client";

import { useRef } from "react";

import PageTopBar from "@/components/PageTopBar";
import { useGsapPageReveal } from "@/hooks/useGsapPageReveal";

export default function GuidePage() {
  const pageRef = useRef<HTMLElement>(null);
  useGsapPageReveal(pageRef);

  return (
    <>
      <PageTopBar />
      <main ref={pageRef} className="page-shell">
        <div className="page-heading">
          <h1>How to Use This App</h1>
          <p className="page-heading__desc">Everything you need to get started — no technical background needed.</p>
        </div>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>What does this app do?</h2>
          <ul style={{ marginTop: "0.6rem", paddingLeft: "1.2rem", lineHeight: "2" }}>
            <li>
              Figures out your <strong>break-even point</strong> automatically — how many items you need to sell to cover all your costs
            </li>
            <li>
              Tracks your <strong>daily sales</strong> and tells you if you made a profit or a loss that day
            </li>
            <li>
              Tells you how much <strong>material to order</strong> and what to buy based on your forecast
            </li>
          </ul>
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>How do I use it?</h2>
          <div className="guide-phases">
            <div className="guide-phase-card">
              <div className="guide-phase-num">1</div>
              <div className="guide-phase-tag">First time only</div>
              <h3>One-Time Setup</h3>
              <p>
                Fill in your products, selling prices, and fixed monthly costs in Steps 1 and 2. Then go to the Materials page to
                add what each product uses. You only need to do this once.
              </p>
            </div>
            <div className="guide-phase-card">
              <div className="guide-phase-num">2</div>
              <div className="guide-phase-tag">Every day</div>
              <h3>Daily Use</h3>
              <p>
                Come back each day, enter how many units you sold (Step 3), then work through Steps 4 to 8. At Step 8, press
                Save to record the day.
              </p>
            </div>
            <div className="guide-phase-card">
              <div className="guide-phase-num">3</div>
              <div className="guide-phase-tag">Anytime</div>
              <h3>Review Your History</h3>
              <p>Go to Analytics to see trends over time. Go to Logs to see a record of every save and delete action.</p>
            </div>
          </div>
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>Common Questions</h2>
          <div className="guide-faq">
            <details>
              <summary>Do I need to fill in Steps 1 and 2 every day?</summary>
              <p>
                No — Steps 1 and 2 only need to be filled in once. Use <strong>&ldquo;Lock&rdquo;</strong> to lock them so
                they don&apos;t get changed by accident while entering daily numbers.
              </p>
            </details>
            <details>
              <summary>What is &ldquo;break-even&rdquo;?</summary>
              <p>
                Break-even is the number of items you need to sell to cover all your costs — nothing more, nothing less. Selling
                fewer than break-even means a loss. Selling more means profit.
              </p>
            </details>
            <details>
              <summary>What does &ldquo;Lock&rdquo; do?</summary>
              <p>
                Lock mode makes Steps 1 and 2 read-only, along with the Materials page. This prevents accidental changes to your
                setup while you&apos;re entering daily sales numbers.
              </p>
            </details>
            <details>
              <summary>What if I made a mistake in a saved record?</summary>
              <p>
                Go to <a href="/analytics">Analytics</a> and use the delete button to remove the incorrect record. Then go back to
                Analysis and re-enter the correct numbers, and save again.
              </p>
            </details>
            <details>
              <summary>Why are some rows green and some red in Analytics?</summary>
              <p>
                Green rows mean the business made a profit or hit break-even that day. Red rows mean the business had a loss —
                costs were higher than what was earned.
              </p>
            </details>
          </div>
        </section>

        <section className="card" style={{ marginTop: "1.25rem" }}>
          <h2>Built by</h2>
          <p>
            This app was developed and maintained by <strong>J. Balbarosa</strong>.
          </p>
          <p style={{ marginTop: "0.4rem" }}>
            <a href="https://www.linkedin.com/in/jbalbarosa/" target="_blank" rel="noreferrer">
              linkedin.com/in/jbalbarosa
            </a>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <a href="/about">Technical details about this project →</a>
          </p>
        </section>
      </main>
    </>
  );
}
