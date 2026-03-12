alter table giveaway_sessions
  add column if not exists spin_duration_ms integer not null default 6000;

update giveaway_sessions
set spin_duration_ms = coalesce(spin_duration_ms, 6000);
