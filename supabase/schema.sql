-- Daily Sprint leaderboard database (Supabase / PostgreSQL)
-- How to use: in your Supabase project, open "SQL Editor", paste this whole file and click "Run".
-- See LAUNCH.md for the full steps.
--
-- Security model, in plain words:
-- * Nobody can read or write the tables directly.
-- * Everyone can READ the four leaderboard views (nickname, country, score only).
-- * Scores can only be ADDED through submit_score(), which checks the player's secret key,
--   rejects impossible scores and dates, and limits how many results one player can send per day.
-- * A player can delete all their data with delete_player() (needed for app store rules).

create table if not exists players (
  id uuid primary key,
  secret uuid not null,
  name text not null check (char_length(name) between 2 and 20),
  country text not null check (country ~ '^[A-Z]{2}$'),
  best_streak int not null default 0 check (best_streak between 0 and 100000),
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id bigint generated always as identity primary key,
  player_id uuid not null references players(id) on delete cascade,
  game text not null check (game ~ '^[a-z]{2,20}$'), -- the game's id from the app; max_score() below rejects unknown games
  score int not null check (score between 0 and 10000),
  day date not null,
  created_at timestamptz not null default now()
);
create index if not exists scores_game_idx on scores (game, score desc);
create index if not exists scores_day_idx on scores (day);
create index if not exists scores_player_idx on scores (player_id, day);

-- Lock the tables: row level security with no policies means no direct access.
alter table players enable row level security;
alter table scores enable row level security;
revoke all on players, scores from anon, authenticated;

-- Highest plausible score per game in one round. A game that isn't listed here can't be submitted,
-- so add every new game id (see the list of games in CLAUDE.md).
create or replace function max_score(p_game text) returns int language sql immutable as $$
  select case p_game
    when 'math' then 6000 when 'memory' then 5000 when 'words' then 4000 when 'spot' then 2000
    when 'colors' then 4000 when 'hunt' then 4000 when 'pattern' then 3000 when 'anagram' then 2500
    when 'target' then 4000 when 'greater' then 4000 when 'count' then 3000
    when 'pairs' then 4000 when 'newpic' then 4000 when 'recall' then 4000
    when 'picspell' then 3000
    when 'twins' then 4000 when 'arrows' then 4000 when 'seeker' then 4000
    when 'bubbles' then 5000 when 'sort' then 4000 when 'flash' then 4000
    when 'balance' then 3000 when 'matrix' then 3000 when 'path' then 3000
    else 0 end;
$$;

create or replace function submit_score(
  p_id uuid, p_secret uuid, p_name text, p_country text,
  p_game text, p_score int, p_day date, p_streak int
) returns void language plpgsql security definer set search_path = public as $$
begin
  -- The app sends the player's local date, which can be a day ahead of or behind the server.
  if p_day not between current_date - 1 and current_date + 1 then raise exception 'invalid day'; end if;
  if p_score < 0 or p_score > max_score(p_game) then raise exception 'invalid score'; end if;

  insert into players (id, secret, name, country, best_streak)
  -- Streaks can't jump: at most 7 for a new player, then at most +2 per submitted result.
  values (p_id, p_secret, trim(p_name), upper(p_country), least(greatest(p_streak, 0), 7))
  on conflict (id) do update
    set name = excluded.name, country = excluded.country,
        best_streak = greatest(players.best_streak, least(excluded.best_streak, players.best_streak + 2))
    where players.secret = p_secret;

  if not exists (select 1 from players where id = p_id and secret = p_secret) then
    raise exception 'not allowed';
  end if;
  if (select count(*) from scores where player_id = p_id and day = p_day) >= 100 then
    raise exception 'too many results today';
  end if;

  insert into scores (player_id, game, score, day) values (p_id, p_game, p_score, p_day);
end $$;

create or replace function delete_player(p_id uuid, p_secret uuid)
returns void language sql security definer set search_path = public as $$
  delete from players where id = p_id and secret = p_secret;
$$;

-- Leaderboard views. They run with the owner's rights, so they can read the locked tables,
-- but they only expose public columns (never the secret).
-- A day's total = the sum of the player's best score in each game that day.
create or replace view board_game as
  select s.game, p.id as player_id, p.name, p.country, max(s.score) as score
  from scores s join players p on p.id = s.player_id
  group by s.game, p.id;

create or replace view board_daily as
  select d.day, p.id as player_id, p.name, p.country, sum(d.best)::int as score
  from (select player_id, day, game, max(score) as best from scores group by player_id, day, game) d
  join players p on p.id = d.player_id
  group by d.day, p.id;

create or replace view board_weekly as
  select date_trunc('week', d.day)::date as week, p.id as player_id, p.name, p.country, sum(d.best)::int as score
  from (select player_id, day, game, max(score) as best from scores group by player_id, day, game) d
  join players p on p.id = d.player_id
  group by date_trunc('week', d.day)::date, p.id;

create or replace view board_streak as
  select id as player_id, name, country, best_streak as score
  from players where best_streak > 0;

grant select on board_game, board_daily, board_weekly, board_streak to anon, authenticated;
revoke execute on function submit_score, delete_player from public;
grant execute on function submit_score, delete_player to anon, authenticated;
