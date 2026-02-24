create extension if not exists pgcrypto;

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nick text not null,
  nick_display text not null,
  character_id text not null,
  score int not null,
  survival_ms int not null,
  useful_caught int not null,
  useful_missed int not null,
  spam_jumped int not null,
  spam_caught int not null,
  accuracy numeric not null,
  client_hash text
);

create index if not exists idx_runs_score_survival on runs (score desc, survival_ms desc);
create index if not exists idx_runs_nick on runs (nick);
create index if not exists idx_runs_character on runs (character_id);
