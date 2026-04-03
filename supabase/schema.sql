create extension if not exists pgcrypto;
create schema if not exists public;

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pipeline_version text not null default '2.0.0',
  finalized boolean not null default false,
  input_payload jsonb not null,
  output_payload jsonb not null
);

create index if not exists idx_pipeline_runs_created_at on public.pipeline_runs (created_at desc);
create index if not exists idx_pipeline_runs_finalized on public.pipeline_runs (finalized);

create table if not exists public.pipeline_audit_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  event_payload jsonb not null
);

create index if not exists idx_pipeline_audit_logs_run_id on public.pipeline_audit_logs (run_id);

create table if not exists public.feedback_loops (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.pipeline_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  actual_demand integer not null,
  actual_units_sold integer not null,
  actual_revenue numeric not null,
  expected_demand integer not null,
  demand_variance integer not null,
  variance_ratio numeric not null,
  notes text null
);

create index if not exists idx_feedback_loops_run_id on public.feedback_loops (run_id);

create table if not exists public.pipeline_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null,
  pipeline_version text null,
  deleted_by_email text not null,
  deleted_payload jsonb not null
);

create index if not exists idx_pipeline_deletion_logs_created_at on public.pipeline_deletion_logs (created_at desc);
create index if not exists idx_pipeline_deletion_logs_run_id on public.pipeline_deletion_logs (run_id);

create table if not exists public.business_analysis_data (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by_email text not null,
  data jsonb not null
);

create table if not exists public.materials_data (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by_email text not null,
  data jsonb not null
);

create table if not exists public.procurement_data (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by_email text not null,
  data jsonb not null
);

-- Optional table for raw procurement transactions if you want granular auditability.
create table if not exists public.procurement_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_name text not null,
  market_price numeric not null,
  quantity_purchased integer not null,
  transaction_cost numeric not null,
  metadata jsonb null
);

alter table public.pipeline_runs enable row level security;
alter table public.procurement_transactions enable row level security;
alter table public.pipeline_audit_logs enable row level security;
alter table public.feedback_loops enable row level security;
alter table public.pipeline_deletion_logs enable row level security;
alter table public.business_analysis_data enable row level security;
alter table public.materials_data enable row level security;
alter table public.procurement_data enable row level security;

-- Keep strict by default; API route uses service role key for server-side inserts/reads.
drop policy if exists "deny_all_pipeline_runs" on public.pipeline_runs;
drop policy if exists "deny_all_procurement_transactions" on public.procurement_transactions;
drop policy if exists "deny_all_pipeline_audit_logs" on public.pipeline_audit_logs;
drop policy if exists "deny_all_feedback_loops" on public.feedback_loops;
drop policy if exists "deny_all_pipeline_deletion_logs" on public.pipeline_deletion_logs;
drop policy if exists "deny_all_business_analysis_data" on public.business_analysis_data;
drop policy if exists "deny_all_materials_data" on public.materials_data;
drop policy if exists "deny_all_procurement_data" on public.procurement_data;

create policy "deny_all_pipeline_runs" on public.pipeline_runs for all using (false);
create policy "deny_all_procurement_transactions" on public.procurement_transactions for all using (false);
create policy "deny_all_pipeline_audit_logs" on public.pipeline_audit_logs for all using (false);
create policy "deny_all_feedback_loops" on public.feedback_loops for all using (false);
create policy "deny_all_pipeline_deletion_logs" on public.pipeline_deletion_logs for all using (false);
create policy "deny_all_business_analysis_data" on public.business_analysis_data for all using (false);
create policy "deny_all_materials_data" on public.materials_data for all using (false);
create policy "deny_all_procurement_data" on public.procurement_data for all using (false);

notify pgrst, 'reload schema';
