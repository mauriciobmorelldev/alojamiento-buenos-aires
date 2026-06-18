create extension if not exists "pgcrypto";

create table if not exists platform_settings (
  id text primary key,
  theme jsonb not null default '{}'::jsonb,
  home_content jsonb not null default '{}'::jsonb,
  filter_groups jsonb not null default '[]'::jsonb,
  tokko_config jsonb not null default '{}'::jsonb,
  email_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table platform_settings
  add column if not exists home_content jsonb not null default '{}'::jsonb;

alter table platform_settings
  add column if not exists filter_groups jsonb not null default '[]'::jsonb;

alter table platform_settings
  add column if not exists tokko_config jsonb not null default '{}'::jsonb;

alter table platform_settings
  add column if not exists email_config jsonb not null default '{}'::jsonb;

create table if not exists roles (
  id text primary key,
  label text not null,
  permissions jsonb not null default '[]'::jsonb
);

insert into roles (id, label, permissions)
values
  ('owner', 'Administrador principal', '["*"]'::jsonb),
  ('colaborador', 'Colaborador', '["properties:create","properties:own"]'::jsonb),
  ('client', 'Cliente final', '["profile:own","favorites:own","leads:own"]'::jsonb)
on conflict (id) do update set label = excluded.label, permissions = excluded.permissions;

create table if not exists profiles (
  id text primary key,
  kind text not null check (kind in ('admin')),
  name text not null,
  email text not null unique,
  password text not null default '',
  role text not null references roles(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles
  add column if not exists phone text not null default '';

create table if not exists admin_otp_challenges (
  id text primary key,
  admin_id text not null references profiles(id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_otp_expires_at on admin_otp_challenges(expires_at);

create table if not exists agents (
  id text primary key,
  name text not null,
  role text not null default 'Corredor',
  phone text not null default '',
  email text not null default '',
  photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id text primary key,
  name text not null,
  email text not null unique,
  password text not null default '',
  phone text not null default '',
  id_number text not null default '',
  email_verified boolean not null default false,
  verification_token text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id text primary key,
  title text not null,
  type text not null check (type in ('tradicional','temporario','pozo','listo')),
  status text not null check (status in ('disponible','pausado','reservado','vendido')),
  price numeric not null default 0,
  price_unit text not null check (price_unit in ('venta','mensual','noche')),
  currency text not null default 'ARS' check (currency in ('ARS','USD')),
  neighborhood text not null default '',
  area numeric not null default 0,
  rooms integer not null default 0,
  tag text not null default '',
  highlight text not null default '',
  description text not null default '',
  videos jsonb not null default '[]'::jsonb,
  cover_index integer not null default 0,
  agent_id text references agents(id) on delete set null,
  created_by_admin_id text references profiles(id) on delete set null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table properties
  add column if not exists created_by_admin_id text references profiles(id) on delete set null;

alter table properties
  add column if not exists currency text not null default 'ARS';

create table if not exists property_images (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create table if not exists property_favorites (
  id text primary key,
  client_id text not null references clients(id) on delete cascade,
  property_id text not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, property_id)
);

create table if not exists leads (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  property_id text references properties(id) on delete set null,
  agent_id text references agents(id) on delete set null,
  client_id text references clients(id) on delete set null,
  status text not null check (status in ('nuevo','visita','reservado','cerrado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_events (
  id text primary key,
  lead_id text not null references leads(id) on delete cascade,
  from_status text check (from_status in ('nuevo','visita','reservado','cerrado')),
  to_status text not null check (to_status in ('nuevo','visita','reservado','cerrado')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists property_metrics (
  id text primary key,
  property_id text not null references properties(id) on delete cascade,
  views integer not null default 0,
  leads integer not null default 0,
  favorites integer not null default 0,
  last_viewed_at timestamptz
);

create table if not exists tokko_sync_logs (
  id text primary key,
  status text not null check (status in ('mocked','success','failed')),
  message text not null,
  imported_count integer not null default 0,
  started_at timestamptz not null,
  finished_at timestamptz not null
);

do $$
begin
  if to_regclass('public.tocco_sync_logs') is not null then
    insert into tokko_sync_logs (id, status, message, imported_count, started_at, finished_at)
    select id, status, message, imported_count, started_at, finished_at
    from tocco_sync_logs
    on conflict (id) do nothing;
  end if;
end $$;

create index if not exists idx_properties_agent on properties(agent_id);
create index if not exists idx_properties_created_by_admin on properties(created_by_admin_id);
create index if not exists idx_properties_status_updated on properties(status, updated_at desc);
create index if not exists idx_profiles_kind_role on profiles(kind, role);
create index if not exists idx_property_images_property_sort on property_images(property_id, sort_order);
create index if not exists idx_leads_agent on leads(agent_id);
create index if not exists idx_leads_property on leads(property_id);
create index if not exists idx_leads_client on leads(client_id);
create index if not exists idx_favorites_client on property_favorites(client_id);
create index if not exists idx_metrics_property on property_metrics(property_id);
create index if not exists idx_tokko_sync_logs_started on tokko_sync_logs(started_at desc);
