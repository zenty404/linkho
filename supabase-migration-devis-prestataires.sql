-- ============================================================
-- Migration : Devis prestataires
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Table
create table if not exists public.devis_prestataires (
  id uuid primary key default gen_random_uuid(),
  evenement_id uuid not null references public.evenements(id) on delete cascade,
  type text not null check (type in ('transport','securite','autre')),
  nom text not null,
  montant numeric,
  pdf_path text not null,
  pdf_nom text not null,
  statut text not null default 'en_attente' check (statut in ('en_attente','signe','refuse')),
  signe_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. RLS
alter table public.devis_prestataires enable row level security;

-- Admin : accès complet
create policy "admin_all_devis_prestataires"
  on public.devis_prestataires
  for all
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');

-- BDE : lecture de ses propres devis prestataires (via evenement.bde_id)
create policy "bde_select_devis_prestataires"
  on public.devis_prestataires
  for select
  using (
    exists (
      select 1 from public.evenements e
      where e.id = devis_prestataires.evenement_id
        and e.bde_id = get_bde_id()
    )
  );

-- BDE : signer / refuser ses propres devis prestataires
create policy "bde_update_devis_prestataires"
  on public.devis_prestataires
  for update
  using (
    exists (
      select 1 from public.evenements e
      where e.id = devis_prestataires.evenement_id
        and e.bde_id = get_bde_id()
    )
  )
  with check (
    exists (
      select 1 from public.evenements e
      where e.id = devis_prestataires.evenement_id
        and e.bde_id = get_bde_id()
    )
  );

-- 3. Bucket Storage privé "documents"
--    À créer manuellement dans Supabase > Storage > New bucket
--    Nom : documents | Public : NON
--    (ou via ce SQL si l'extension storage est disponible)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
-- on conflict (id) do nothing;
