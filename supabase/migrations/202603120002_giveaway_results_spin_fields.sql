alter table giveaway_results
  alter column profile_id drop not null;

alter table giveaway_results
  add column if not exists winner_nickname text not null default '';

alter table giveaway_results
  add column if not exists spin_duration_ms integer not null default 5000;

update giveaway_results
set
  winner_nickname = coalesce(winner_nickname, ''),
  spin_duration_ms = coalesce(spin_duration_ms, 5000);
