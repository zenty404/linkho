-- ============================================================
-- LINKHO — Schéma base de données complet
-- Version 2 — Mai 2026
-- À appliquer dans Supabase SQL Editor dans l'ordre ci-dessous
-- ============================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- pour contrainte non-chevauchement dates

-- ============================================================
-- 1. USERS — Profils utilisateurs
-- ============================================================
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('bde', 'etablissement', 'admin')),
  full_name     TEXT,
  email         TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BDE_PROFILES — Infos des associations étudiantes
-- ============================================================
CREATE TABLE public.bde_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  ecole         TEXT NOT NULL,
  ville         TEXT,
  logo_url      TEXT,
  telephone     TEXT,
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. ETABLISSEMENT_PROFILES — Infos des lieux événementiels
-- ============================================================
CREATE TABLE public.etablissement_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nom                 TEXT NOT NULL,
  slug                TEXT UNIQUE,
  description         TEXT,
  adresse             TEXT,
  ville               TEXT,
  code_postal         TEXT,
  latitude            NUMERIC(10, 7),
  longitude           NUMERIC(10, 7),
  telephone           TEXT,
  email_contact       TEXT,
  site_web            TEXT,
  -- Caractéristiques du lieu
  capacite_max        INTEGER,
  nb_couchages        INTEGER,
  nb_chambres         INTEGER,
  nb_salles_de_bain   INTEGER,
  superficie_m2       INTEGER,
  prix_base           NUMERIC(10, 2),  -- prix de base par nuit/week-end
  -- Équipements (flags booléens)
  equip_piscine       BOOLEAN DEFAULT FALSE,
  equip_salle_soiree  BOOLEAN DEFAULT FALSE,
  equip_exterieur     BOOLEAN DEFAULT FALSE,
  equip_parking       BOOLEAN DEFAULT FALSE,
  equip_wifi          BOOLEAN DEFAULT FALSE,
  equip_cuisine       BOOLEAN DEFAULT FALSE,
  equip_bar           BOOLEAN DEFAULT FALSE,
  equip_sonorisation  BOOLEAN DEFAULT FALSE,
  -- Finance
  iban                TEXT,
  commission_rate     NUMERIC(5, 4) DEFAULT 0.10,  -- ex: 0.12 = 12%, défini par admin
  -- Statut
  actif               BOOLEAN NOT NULL DEFAULT TRUE,
  visible             BOOLEAN NOT NULL DEFAULT TRUE,  -- visible sur le catalogue public
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 4. COMMISSION_RATE_HISTORY — Historique des taux de commission
-- ============================================================
CREATE TABLE public.commission_rate_history (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etablissement_id      UUID NOT NULL REFERENCES public.etablissement_profiles(id) ON DELETE CASCADE,
  ancien_taux           NUMERIC(5, 4) NOT NULL,
  nouveau_taux          NUMERIC(5, 4) NOT NULL,
  modifie_par           UUID NOT NULL REFERENCES public.users(id),
  note                  TEXT,  -- commentaire optionnel de l'admin
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. ETABLISSEMENT_PHOTOS — Photos des lieux
-- ============================================================
CREATE TABLE public.etablissement_photos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etablissement_id  UUID NOT NULL REFERENCES public.etablissement_profiles(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  ordre             INTEGER DEFAULT 0,  -- ordre d'affichage
  est_principale    BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. DEMANDES_DEVIS — Demande initiale d'un BDE
-- ============================================================
CREATE TABLE public.demandes_devis (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bde_id            UUID NOT NULL REFERENCES public.bde_profiles(id) ON DELETE CASCADE,
  etablissement_id  UUID NOT NULL REFERENCES public.etablissement_profiles(id) ON DELETE CASCADE,
  type_evenement    TEXT NOT NULL CHECK (type_evenement IN ('wei', 'soiree', 'ski', 'gala', 'seminaire', 'sportif', 'autre')),
  date_debut        DATE NOT NULL,
  date_fin          DATE NOT NULL,
  nb_participants   INTEGER NOT NULL,
  message           TEXT,
  statut            TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'devis_envoye', 'acceptee', 'refusee', 'annulee')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. DEVIS — Devis envoyés par les établissements
-- ============================================================
CREATE TABLE public.devis (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero            TEXT NOT NULL UNIQUE,  -- format: DV-2026-001
  demande_id        UUID NOT NULL REFERENCES public.demandes_devis(id) ON DELETE CASCADE,
  etablissement_id  UUID NOT NULL REFERENCES public.etablissement_profiles(id),
  bde_id            UUID NOT NULL REFERENCES public.bde_profiles(id),
  -- Infos générales
  date_evenement_debut  DATE NOT NULL,
  date_evenement_fin    DATE NOT NULL,
  nb_participants       INTEGER NOT NULL,
  -- Financier
  sous_total_ht     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tva_taux          NUMERIC(5, 4) NOT NULL DEFAULT 0.10,  -- 10%
  tva_montant       NUMERIC(10, 2) GENERATED ALWAYS AS (sous_total_ht * tva_taux) STORED,
  total_ttc         NUMERIC(10, 2) GENERATED ALWAYS AS (sous_total_ht + (sous_total_ht * tva_taux)) STORED,
  acompte_taux      NUMERIC(5, 4) NOT NULL DEFAULT 0.30,  -- 30%
  acompte_montant   NUMERIC(10, 2) GENERATED ALWAYS AS ((sous_total_ht + (sous_total_ht * tva_taux)) * 0.30) STORED,
  solde_montant     NUMERIC(10, 2) GENERATED ALWAYS AS ((sous_total_ht + (sous_total_ht * tva_taux)) * 0.70) STORED,
  -- Commission LINKHO (snapshot au moment du devis)
  commission_taux   NUMERIC(5, 4) NOT NULL,  -- snapshot du taux au moment de création
  commission_montant NUMERIC(10, 2) GENERATED ALWAYS AS (sous_total_ht * commission_taux) STORED,
  -- Contenu
  message_client    TEXT,
  -- Statut
  statut            TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'consulte', 'accepte', 'refuse', 'signe', 'annule')),
  -- Signature YouSign
  yousign_document_id   TEXT,
  yousign_signature_url TEXT,
  signe_le          TIMESTAMPTZ,
  -- Timestamps
  envoye_le         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Séquence pour numérotation des devis
CREATE SEQUENCE IF NOT EXISTS devis_numero_seq START 1;

-- ============================================================
-- 8. DEVIS_ITEMS — Lignes de prestation d'un devis
-- ============================================================
CREATE TABLE public.devis_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id    UUID NOT NULL REFERENCES public.devis(id) ON DELETE CASCADE,
  libelle     TEXT NOT NULL,
  description TEXT,
  quantite    INTEGER NOT NULL DEFAULT 1,
  prix_unitaire NUMERIC(10, 2) NOT NULL,
  total       NUMERIC(10, 2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
  ordre       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. RESERVATIONS — Réservations confirmées
-- ============================================================
CREATE TABLE public.reservations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference         TEXT NOT NULL UNIQUE,  -- format: RES-2026-001
  devis_id          UUID NOT NULL REFERENCES public.devis(id),
  bde_id            UUID NOT NULL REFERENCES public.bde_profiles(id),
  etablissement_id  UUID NOT NULL REFERENCES public.etablissement_profiles(id),
  -- Dates
  date_debut        DATE NOT NULL,
  date_fin          DATE NOT NULL,
  nb_participants   INTEGER NOT NULL,
  -- Financier (snapshot depuis le devis signé)
  montant_ht        NUMERIC(10, 2) NOT NULL,
  montant_tva       NUMERIC(10, 2) NOT NULL,
  montant_ttc       NUMERIC(10, 2) NOT NULL,
  acompte_montant   NUMERIC(10, 2) NOT NULL,
  solde_montant     NUMERIC(10, 2) NOT NULL,
  commission_taux   NUMERIC(5, 4) NOT NULL,
  commission_montant NUMERIC(10, 2) NOT NULL,
  caution_montant   NUMERIC(10, 2),  -- défini par l'établissement pour cette réservation spécifique
  -- Statut global
  statut            TEXT NOT NULL DEFAULT 'devis_signe' CHECK (statut IN (
    'devis_signe',
    'acompte_en_attente',
    'acompte_confirme',
    'confirmee',
    'en_cours',
    'terminee',
    'annulee'
  )),
  -- RDV Cal.com
  rdv_effectue      BOOLEAN DEFAULT FALSE,
  rdv_date          TIMESTAMPTZ,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contrainte de non-chevauchement des dates par établissement
CREATE INDEX reservations_no_overlap
  ON public.reservations USING GIST (
    etablissement_id,
    DATERANGE(date_debut, date_fin, '[]')
  )
  WHERE statut NOT IN ('annulee');

-- ============================================================
-- 10. PAIEMENTS — Suivi des paiements manuels
-- ============================================================
CREATE TABLE public.paiements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id    UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('acompte', 'solde', 'commission')),
  montant           NUMERIC(10, 2) NOT NULL,
  reference_virement TEXT NOT NULL,  -- ex: LINKHO-DV-2026-058-ACOMPTE
  -- Confirmation manuelle
  confirme          BOOLEAN NOT NULL DEFAULT FALSE,
  confirme_le       TIMESTAMPTZ,
  confirme_par      UUID REFERENCES public.users(id),
  note              TEXT,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reservation_id, type)  -- un seul paiement de chaque type par réservation
);

-- ============================================================
-- 11. FACTURES — Factures générées
-- ============================================================
CREATE TABLE public.factures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero          TEXT NOT NULL UNIQUE,  -- format: FAC-2026-001
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  paiement_id     UUID REFERENCES public.paiements(id),
  type            TEXT NOT NULL CHECK (type IN ('acompte', 'solde', 'commission')),
  montant_ht      NUMERIC(10, 2) NOT NULL,
  montant_tva     NUMERIC(10, 2) NOT NULL,
  montant_ttc     NUMERIC(10, 2) NOT NULL,
  pdf_url         TEXT,  -- URL Supabase Storage
  emise_le        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. ETATS_DES_LIEUX — États des lieux numériques
-- ============================================================
CREATE TABLE public.etats_des_lieux (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id    UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
  -- Contenu
  observations      TEXT,
  -- Photos (stockées dans Supabase Storage, URLs ici)
  photos_urls       TEXT[],  -- array d'URLs
  -- Signatures YouSign
  yousign_document_id     TEXT,
  signe_par_gerant        BOOLEAN DEFAULT FALSE,
  signe_par_bde           BOOLEAN DEFAULT FALSE,
  signe_par_gerant_le     TIMESTAMPTZ,
  signe_par_bde_le        TIMESTAMPTZ,
  verrouille              BOOLEAN DEFAULT FALSE,  -- verrouillé après double signature
  verrouille_le           TIMESTAMPTZ,
  -- Dommages (sortie uniquement)
  dommages_signales       BOOLEAN DEFAULT FALSE,
  dommages_description    TEXT,
  dommages_signales_le    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reservation_id, type)
);

-- ============================================================
-- 13. DOCUMENTS — Gestionnaire documentaire centralisé
-- ============================================================
CREATE TABLE public.documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Propriétaire du document
  bde_id            UUID REFERENCES public.bde_profiles(id) ON DELETE CASCADE,
  etablissement_id  UUID REFERENCES public.etablissement_profiles(id) ON DELETE CASCADE,
  -- Liens contextuels
  reservation_id    UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  devis_id          UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  facture_id        UUID REFERENCES public.factures(id) ON DELETE SET NULL,
  etat_des_lieux_id UUID REFERENCES public.etats_des_lieux(id) ON DELETE SET NULL,
  -- Infos document
  nom               TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('devis', 'devis_signe', 'facture', 'contrat', 'etat_des_lieux', 'autre')),
  url               TEXT NOT NULL,  -- URL Supabase Storage
  taille_bytes      INTEGER,
  -- Archivage légal
  date_document     DATE NOT NULL DEFAULT CURRENT_DATE,
  archive_jusqu_au  DATE GENERATED ALWAYS AS (date_document + INTERVAL '10 years') STORED,
  statut_archive    TEXT NOT NULL DEFAULT 'archive' CHECK (statut_archive IN ('archive', 'supprime')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. EVENEMENTS — Événements créés par les BDE
-- ============================================================
CREATE TABLE public.evenements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bde_id          UUID NOT NULL REFERENCES public.bde_profiles(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES public.reservations(id) ON DELETE SET NULL,  -- optionnel
  nom             TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('wei', 'soiree', 'ski', 'gala', 'seminaire', 'sportif', 'autre')),
  date_debut      DATE,
  date_fin        DATE,
  nb_places_max   INTEGER,
  description     TEXT,
  statut          TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'complet', 'termine', 'annule')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. FORMULAIRE_INSCRIPTIONS — Formulaires d'inscription BDE
-- ============================================================
CREATE TABLE public.formulaire_inscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evenement_id  UUID NOT NULL REFERENCES public.evenements(id) ON DELETE CASCADE,
  bde_id        UUID NOT NULL REFERENCES public.bde_profiles(id) ON DELETE CASCADE,
  titre         TEXT NOT NULL,
  description   TEXT,
  -- Champs du formulaire stockés en JSON
  champs        JSONB NOT NULL DEFAULT '[]',
  -- Paramètres paiement
  prix_total    NUMERIC(10, 2),
  -- Publication
  publie        BOOLEAN NOT NULL DEFAULT FALSE,
  publie_le     TIMESTAMPTZ,
  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(evenement_id)  -- un seul formulaire par événement
);

-- Exemple de structure JSONB pour champs :
-- [
--   {
--     "id": "field_1",
--     "type": "text_court",
--     "libelle": "Nom complet",
--     "obligatoire": true,
--     "placeholder": "Jean Dupont",
--     "aide": "",
--     "validation": { "min": 2, "max": 100 },
--     "ordre": 0
--   },
--   {
--     "id": "field_2",
--     "type": "selection_unique",
--     "libelle": "Formule",
--     "obligatoire": true,
--     "options": ["Entrée seule - 25€", "Entrée + Dîner - 45€"],
--     "ordre": 1
--   }
-- ]

-- ============================================================
-- 16. INSCRIPTIONS — Inscriptions des étudiants
-- ============================================================
CREATE TABLE public.inscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formulaire_id     UUID NOT NULL REFERENCES public.formulaire_inscriptions(id) ON DELETE CASCADE,
  evenement_id      UUID NOT NULL REFERENCES public.evenements(id) ON DELETE CASCADE,
  bde_id            UUID NOT NULL REFERENCES public.bde_profiles(id) ON DELETE CASCADE,
  -- Infos étudiant
  nom               TEXT NOT NULL,
  prenom            TEXT NOT NULL,
  email             TEXT NOT NULL,
  -- Réponses au formulaire
  reponses          JSONB NOT NULL DEFAULT '{}',
  -- Statut global
  statut            TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'annulee')),
  -- Paiement
  montant_total     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  statut_paiement   TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_paiement IN (
    'en_attente',
    'partiel',
    'paye_total'
  )),
  -- Caution
  caution_payee     BOOLEAN NOT NULL DEFAULT FALSE,
  caution_montant   NUMERIC(10, 2),
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 17. INSCRIPTION_ECHEANCES — Échéances de paiement étudiant
-- ============================================================
CREATE TABLE public.inscription_echeances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscription_id  UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  numero          INTEGER NOT NULL,  -- 1, 2, 3...
  montant         NUMERIC(10, 2) NOT NULL,
  date_echeance   DATE,
  paye            BOOLEAN NOT NULL DEFAULT FALSE,
  paye_le         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. MESSAGES — Messagerie BDE ↔ Établissement
-- ============================================================
CREATE TABLE public.messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id    UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  demande_id        UUID REFERENCES public.demandes_devis(id) ON DELETE CASCADE,
  expediteur_id     UUID NOT NULL REFERENCES public.users(id),
  destinataire_id   UUID NOT NULL REFERENCES public.users(id),
  contenu           TEXT NOT NULL,
  lu                BOOLEAN NOT NULL DEFAULT FALSE,
  lu_le             TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Contexte optionnel (réservation, demande, ou message direct avec admin)
);

-- ============================================================
-- 19. NOTIFICATIONS — Notifications in-app
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
    'nouveau_devis',
    'devis_signe',
    'nouveau_message',
    'acompte_confirme',
    'reservation_confirmee',
    'rappel_paiement',
    'rdv_a_venir',
    'etat_des_lieux_signer',
    'commission_reversee',
    'dommage_signale'
  )),
  titre       TEXT NOT NULL,
  contenu     TEXT,
  lu          BOOLEAN NOT NULL DEFAULT FALSE,
  lu_le       TIMESTAMPTZ,
  -- Liens contextuels optionnels
  reservation_id  UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  devis_id        UUID REFERENCES public.devis(id) ON DELETE CASCADE,
  lien            TEXT,  -- URL de redirection
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Pour les performances
-- ============================================================

-- Users
CREATE INDEX idx_users_role ON public.users(role);

-- BDE
CREATE INDEX idx_bde_profiles_user_id ON public.bde_profiles(user_id);

-- Établissements
CREATE INDEX idx_etablissement_profiles_user_id ON public.etablissement_profiles(user_id);
CREATE INDEX idx_etablissement_profiles_ville ON public.etablissement_profiles(ville);
CREATE INDEX idx_etablissement_profiles_actif ON public.etablissement_profiles(actif, visible);

-- Demandes
CREATE INDEX idx_demandes_devis_bde_id ON public.demandes_devis(bde_id);
CREATE INDEX idx_demandes_devis_etablissement_id ON public.demandes_devis(etablissement_id);
CREATE INDEX idx_demandes_devis_statut ON public.demandes_devis(statut);

-- Devis
CREATE INDEX idx_devis_demande_id ON public.devis(demande_id);
CREATE INDEX idx_devis_bde_id ON public.devis(bde_id);
CREATE INDEX idx_devis_etablissement_id ON public.devis(etablissement_id);
CREATE INDEX idx_devis_statut ON public.devis(statut);

-- Réservations
CREATE INDEX idx_reservations_bde_id ON public.reservations(bde_id);
CREATE INDEX idx_reservations_etablissement_id ON public.reservations(etablissement_id);
CREATE INDEX idx_reservations_statut ON public.reservations(statut);
CREATE INDEX idx_reservations_dates ON public.reservations(date_debut, date_fin);

-- Paiements
CREATE INDEX idx_paiements_reservation_id ON public.paiements(reservation_id);
CREATE INDEX idx_paiements_confirme ON public.paiements(confirme);

-- Inscriptions
CREATE INDEX idx_inscriptions_formulaire_id ON public.inscriptions(formulaire_id);
CREATE INDEX idx_inscriptions_evenement_id ON public.inscriptions(evenement_id);
CREATE INDEX idx_inscriptions_statut ON public.inscriptions(statut);
CREATE INDEX idx_inscriptions_email ON public.inscriptions(email);

-- Messages
CREATE INDEX idx_messages_expediteur ON public.messages(expediteur_id);
CREATE INDEX idx_messages_destinataire ON public.messages(destinataire_id);
CREATE INDEX idx_messages_reservation ON public.messages(reservation_id);
CREATE INDEX idx_messages_lu ON public.messages(lu);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_lu ON public.notifications(lu);

-- Documents
CREATE INDEX idx_documents_bde_id ON public.documents(bde_id);
CREATE INDEX idx_documents_etablissement_id ON public.documents(etablissement_id);
CREATE INDEX idx_documents_reservation_id ON public.documents(reservation_id);
CREATE INDEX idx_documents_type ON public.documents(type);

-- ============================================================
-- TRIGGERS — updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bde_profiles_updated_at
  BEFORE UPDATE ON public.bde_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_etablissement_profiles_updated_at
  BEFORE UPDATE ON public.etablissement_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_demandes_devis_updated_at
  BEFORE UPDATE ON public.demandes_devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_devis_updated_at
  BEFORE UPDATE ON public.devis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_paiements_updated_at
  BEFORE UPDATE ON public.paiements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_etats_des_lieux_updated_at
  BEFORE UPDATE ON public.etats_des_lieux
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_evenements_updated_at
  BEFORE UPDATE ON public.evenements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_formulaire_inscriptions_updated_at
  BEFORE UPDATE ON public.formulaire_inscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_inscriptions_updated_at
  BEFORE UPDATE ON public.inscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER — Création automatique du profil user après signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'bde'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER — Snapshot commission_rate à la création d'un devis
-- ============================================================

CREATE OR REPLACE FUNCTION set_devis_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commission_taux IS NULL OR NEW.commission_taux = 0 THEN
    SELECT commission_rate INTO NEW.commission_taux
    FROM public.etablissement_profiles
    WHERE id = NEW.etablissement_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_devis_commission_rate
  BEFORE INSERT ON public.devis
  FOR EACH ROW EXECUTE FUNCTION set_devis_commission_rate();

-- ============================================================
-- TRIGGER — Historique commission_rate lors d'une modif
-- ============================================================

CREATE OR REPLACE FUNCTION log_commission_rate_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.commission_rate IS DISTINCT FROM NEW.commission_rate THEN
    INSERT INTO public.commission_rate_history (
      etablissement_id, ancien_taux, nouveau_taux, modifie_par
    ) VALUES (
      NEW.id, OLD.commission_rate, NEW.commission_rate, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commission_rate_history
  AFTER UPDATE ON public.etablissement_profiles
  FOR EACH ROW EXECUTE FUNCTION log_commission_rate_change();

-- ============================================================
-- TRIGGER — Génération numéro devis automatique
-- ============================================================

CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := 'DV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                  LPAD(NEXTVAL('devis_numero_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_devis_numero
  BEFORE INSERT ON public.devis
  FOR EACH ROW EXECUTE FUNCTION generate_devis_numero();

-- ============================================================
-- RLS — Row Level Security
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bde_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etablissement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etablissement_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etats_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulaire_inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_echeances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions pour les RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_bde_id()
RETURNS UUID AS $$
  SELECT id FROM public.bde_profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_etablissement_id()
RETURNS UUID AS $$
  SELECT id FROM public.etablissement_profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ---- USERS ----
CREATE POLICY "users_self_read" ON public.users
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ---- BDE_PROFILES ----
CREATE POLICY "bde_profiles_self" ON public.bde_profiles
  FOR ALL USING (user_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "bde_profiles_etablissement_read" ON public.bde_profiles
  FOR SELECT USING (get_user_role() = 'etablissement');

-- ---- ETABLISSEMENT_PROFILES ----
CREATE POLICY "etablissement_self" ON public.etablissement_profiles
  FOR ALL USING (user_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "etablissement_public_read" ON public.etablissement_profiles
  FOR SELECT USING (visible = TRUE AND actif = TRUE);

CREATE POLICY "etablissement_bde_read" ON public.etablissement_profiles
  FOR SELECT USING (get_user_role() = 'bde');

-- ---- COMMISSION_RATE_HISTORY ----
CREATE POLICY "commission_history_admin" ON public.commission_rate_history
  FOR ALL USING (get_user_role() = 'admin');

CREATE POLICY "commission_history_etablissement_read" ON public.commission_rate_history
  FOR SELECT USING (
    etablissement_id = get_etablissement_id()
  );

-- ---- ETABLISSEMENT_PHOTOS ----
CREATE POLICY "photos_public_read" ON public.etablissement_photos
  FOR SELECT USING (TRUE);

CREATE POLICY "photos_etablissement_write" ON public.etablissement_photos
  FOR ALL USING (
    etablissement_id = get_etablissement_id()
    OR get_user_role() = 'admin'
  );

-- ---- DEMANDES_DEVIS ----
CREATE POLICY "demandes_bde_own" ON public.demandes_devis
  FOR ALL USING (
    bde_id = get_bde_id()
    OR etablissement_id = get_etablissement_id()
    OR get_user_role() = 'admin'
  );

-- ---- DEVIS ----
CREATE POLICY "devis_parties" ON public.devis
  FOR ALL USING (
    bde_id = get_bde_id()
    OR etablissement_id = get_etablissement_id()
    OR get_user_role() = 'admin'
  );

-- ---- DEVIS_ITEMS ----
CREATE POLICY "devis_items_via_devis" ON public.devis_items
  FOR ALL USING (
    devis_id IN (
      SELECT id FROM public.devis
      WHERE bde_id = get_bde_id()
         OR etablissement_id = get_etablissement_id()
    )
    OR get_user_role() = 'admin'
  );

-- ---- RESERVATIONS ----
CREATE POLICY "reservations_parties" ON public.reservations
  FOR ALL USING (
    bde_id = get_bde_id()
    OR etablissement_id = get_etablissement_id()
    OR get_user_role() = 'admin'
  );

-- ---- PAIEMENTS ----
CREATE POLICY "paiements_parties" ON public.paiements
  FOR ALL USING (
    reservation_id IN (
      SELECT id FROM public.reservations
      WHERE bde_id = get_bde_id()
         OR etablissement_id = get_etablissement_id()
    )
    OR get_user_role() = 'admin'
  );

-- ---- FACTURES ----
CREATE POLICY "factures_parties" ON public.factures
  FOR ALL USING (
    reservation_id IN (
      SELECT id FROM public.reservations
      WHERE bde_id = get_bde_id()
         OR etablissement_id = get_etablissement_id()
    )
    OR get_user_role() = 'admin'
  );

-- ---- ETATS_DES_LIEUX ----
CREATE POLICY "edl_parties" ON public.etats_des_lieux
  FOR ALL USING (
    reservation_id IN (
      SELECT id FROM public.reservations
      WHERE bde_id = get_bde_id()
         OR etablissement_id = get_etablissement_id()
    )
    OR get_user_role() = 'admin'
  );

-- ---- DOCUMENTS ----
CREATE POLICY "documents_own" ON public.documents
  FOR ALL USING (
    bde_id = get_bde_id()
    OR etablissement_id = get_etablissement_id()
    OR get_user_role() = 'admin'
  );

-- ---- EVENEMENTS ----
CREATE POLICY "evenements_bde_own" ON public.evenements
  FOR ALL USING (
    bde_id = get_bde_id()
    OR get_user_role() = 'admin'
  );

-- ---- FORMULAIRE_INSCRIPTIONS ----
CREATE POLICY "formulaires_bde_own" ON public.formulaire_inscriptions
  FOR ALL USING (
    bde_id = get_bde_id()
    OR get_user_role() = 'admin'
  );

-- ---- INSCRIPTIONS ----
CREATE POLICY "inscriptions_bde_own" ON public.inscriptions
  FOR ALL USING (
    bde_id = get_bde_id()
    OR get_user_role() = 'admin'
  );

-- ---- INSCRIPTION_ECHEANCES ----
CREATE POLICY "echeances_bde_own" ON public.inscription_echeances
  FOR ALL USING (
    inscription_id IN (
      SELECT id FROM public.inscriptions
      WHERE bde_id = get_bde_id()
    )
    OR get_user_role() = 'admin'
  );

-- ---- MESSAGES ----
-- Lecture : on voit ses propres messages (envoyés ou reçus)
CREATE POLICY "messages_read" ON public.messages
  FOR SELECT USING (
    expediteur_id = auth.uid()
    OR destinataire_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- Écriture : n'importe quel utilisateur connecté peut envoyer un message
-- (y compris contacter un admin directement)
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    expediteur_id = auth.uid()
  );

-- Mise à jour : uniquement le destinataire peut marquer comme lu
CREATE POLICY "messages_update_lu" ON public.messages
  FOR UPDATE USING (
    destinataire_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (
    user_id = auth.uid()
    OR get_user_role() = 'admin'
  );

-- ============================================================
-- FIN DU SCHÉMA
-- ============================================================