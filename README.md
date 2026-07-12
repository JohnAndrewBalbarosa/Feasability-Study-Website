# Feasability-Study-Website

## Overview

A website for a group of student's feasibility study

Repository: [JohnAndrewBalbarosa/Feasability-Study-Website](https://github.com/JohnAndrewBalbarosa/Feasability-Study-Website)

## Problem and Goal

**Problem.** A student feasibility-study team needs one place to compare procurement inputs, estimate break-even conditions, document assumptions, and control access to private analysis.

**Goal.** Provide a web application for structured feasibility analysis, forecast ranges, stored evidence, and auditable team decisions.

## System Design

- `app/` + `components/`: Next.js routes and interface components.
- `lib/` + `hooks/`: calculations, data access, and reusable client behavior.
- `supabase/`: persistence/schema assets; `middleware.ts`: access control.
- `tests/` + `vitest.config.ts`: automated validation.

## Setup and Usage

```bash
npm install
cp .env.example .env.local
npm run dev

# Validation
npm test
npm run build
```

## Evaluation Method

- Define the project task and expected behavior.
- Run representative examples or user flows.
- Record correctness, speed, reliability, usability, and failure cases.

## Results

- No validated quantitative results are published yet.
- Current README status: implementation and usage are documented before formal measurement.

## Interpretation

- The project can be described as implemented or in progress, but impact claims should stay limited until measurements are collected.
- Use the evaluation plan below to turn the project into resume-ready, evidence-backed work.

## Limitations

- Results should only be treated as validated when this README includes the dataset, sample size, metric definition, and reproduction steps.
- Any AI-generated, OCR-based, scraped, or heuristic output requires manual review before being used as ground truth.
- Environment-dependent measurements such as latency, memory use, browser behavior, and API reliability should be re-measured on the target machine.

## Recommendations and Future Work

- Forecast error against known sample data.
- Break-even calculation accuracy.
- Number of procurement scenarios tested.

## Documentation Standard

This README follows a technical-project structure: overview, goal, system design, setup, evaluation method, results, interpretation, limitations, and recommendations. Update the Results section whenever new measurements are available so project claims stay evidence-backed.
