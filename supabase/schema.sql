create extension if not exists pgcrypto;

create table if not exists pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pipeline_version text not null default '2.0.0',
  finalized boolean not null default false,
  input_payload jsonb not null,
  output_payload jsonb not null
);

create index if not exists idx_pipeline_runs_created_at on pipeline_runs (created_at desc);
create index if not exists idx_pipeline_runs_finalized on pipeline_runs (finalized);

create table if not exists pipeline_audit_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references pipeline_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  event_payload jsonb not null
);

create index if not exists idx_pipeline_audit_logs_run_id on pipeline_audit_logs (run_id);

create table if not exists feedback_loops (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references pipeline_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  actual_demand integer not null,
  actual_units_sold integer not null,
  actual_revenue numeric not null,
  expected_demand integer not null,
  demand_variance integer not null,
  variance_ratio numeric not null,
  notes text null
);

create index if not exists idx_feedback_loops_run_id on feedback_loops (run_id);

create table if not exists pipeline_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null,
  pipeline_version text null,
  deleted_by_email text not null,
  deleted_payload jsonb not null
);

create index if not exists idx_pipeline_deletion_logs_created_at on pipeline_deletion_logs (created_at desc);
create index if not exists idx_pipeline_deletion_logs_run_id on pipeline_deletion_logs (run_id);

-- Optional table for raw procurement transactions if you want granular auditability.
create table if not exists procurement_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_name text not null,
  market_price numeric not null,
  quantity_purchased integer not null,
  transaction_cost numeric not null,
  metadata jsonb null
);

alter table pipeline_runs enable row level security;
alter table procurement_transactions enable row level security;
alter table pipeline_audit_logs enable row level security;
alter table feedback_loops enable row level security;
alter table pipeline_deletion_logs enable row level security;

-- Keep strict by default; API route uses service role key for server-side inserts/reads.
create policy "deny_all_pipeline_runs" on pipeline_runs for all using (false);
create policy "deny_all_procurement_transactions" on procurement_transactions for all using (false);
create policy "deny_all_pipeline_audit_logs" on pipeline_audit_logs for all using (false);
create policy "deny_all_feedback_loops" on feedback_loops for all using (false);
create policy "deny_all_pipeline_deletion_logs" on pipeline_deletion_logs for all using (false);
