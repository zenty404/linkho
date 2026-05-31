# LINKHO — Context for Claude Code

## Project
Plateforme de mise en relation BDE ↔ lieux événementiels.
"L'Airbnb de l'événementiel étudiant."
3 espaces : BDE / Établissement / Admin LINKHO.

---

## Stack
- **Framework** : Next.js 14+ App Router, React, TypeScript strict
- **DB** : Supabase (PostgreSQL + RLS + Realtime + Storage)
- **Style** : Tailwind CSS v4 (config dans globals.css, pas de tailwind.config.ts)
- **Deploy** : Vercel (branch dev → preview, branch main → production)
- **Monitoring** : Sentry

## APIs externes
| Service | Usage | Package |
|---|---|---|
| YouSign | Signature électronique (devis, contrats, EDL) | REST API |
| Mapbox | Carte interactive catalogue | `mapbox-gl` |
| Cal.com | RDV obligatoire post-réservation | `@calcom/embed-react` |
| Resend | Emails transactionnels | `resend` + `react-email` |
| React-PDF | Génération PDF côté serveur | `@react-pdf/renderer` |
| Supabase Storage | Photos + documents archivés | inclus Supabase |

---

## Couleurs (Tailwind v4)
```css
--color-navy: #071634       /* bg-navy — sidebar, header, dark surfaces */
--color-navy-light: #0f2350 /* bg-navy-light — hover states */
--color-brand: #f49915      /* bg-brand — CTA, accents, highlights */
--color-brand-light: #f7b547 /* bg-brand-light — hover brand */
```
Utiliser systématiquement ces variables, jamais de couleurs hardcodées.

---

## Architecture App Router
```
/src/app
  /(public)/          → Site public (accueil, catalogue, détail lieu)
  /(auth)/            → Connexion, inscription
  /(bde)/             → Espace BDE (layout avec sidebar navy)
  /(etablissement)/   → Espace établissement (layout avec sidebar navy)
  /(admin)/           → Espace admin LINKHO (layout avec sidebar navy)
/src/components/
  /ui/                → Composants primitifs réutilisables
  /bde/               → Composants spécifiques espace BDE
  /etablissement/     → Composants spécifiques espace établissement
  /admin/             → Composants spécifiques espace admin
  /shared/            → Composants partagés entre espaces
/src/lib/
  /supabase/          → Client Supabase (client.ts, server.ts, middleware.ts)
  /actions/           → Server Actions par domaine
  /utils/             → Fonctions utilitaires
  /types/             → Types TypeScript générés depuis Supabase
/src/emails/          → Templates react-email
```

---

## Supabase — Règles absolues
- **RLS activée sur toutes les tables** — ne jamais contourner avec service_role côté client
- **Helper functions disponibles** :
  - `get_user_role()` → retourne le rôle de l'utilisateur connecté
  - `get_bde_id()` → retourne l'UUID du bde_profile de l'utilisateur connecté
  - `get_etablissement_id()` → retourne l'UUID du etablissement_profile de l'utilisateur connecté
- **Service role key** : uniquement dans les Server Actions et Route Handlers (jamais exposé côté client)
- **Client Supabase** :
  - `createClient()` depuis `@/lib/supabase/client.ts` → côté client
  - `createServerClient()` depuis `@/lib/supabase/server.ts` → côté serveur (Server Actions, Route Handlers)

---

## Rôles utilisateurs
```typescript
type UserRole = 'bde' | 'etablissement' | 'admin'
```
- Le rôle est dans `public.users.role`
- Middleware Next.js vérifie le rôle à chaque route protégée
- Redirections : `/bde/dashboard`, `/etablissement/dashboard`, `/admin/dashboard`

---

## Schéma BDD — 19 tables (ordre de dépendance)
```
1.  users                    — Profil de base (lié à auth.users via trigger)
2.  bde_profiles             — Infos BDE (école, logo, actif)
3.  etablissement_profiles   — Infos lieu (IBAN, commission_rate, équipements, coords)
4.  commission_rate_history  — Historique taux commission (trigger auto)
5.  etablissement_photos     — Photos du lieu (ordre, est_principale)
6.  demandes_devis           — Demande initiale BDE → Établissement
7.  devis                    — Devis établissement (colonnes GENERATED pour calculs)
8.  devis_items              — Lignes de prestation du devis
9.  reservations             — Réservation confirmée (snapshot financier immuable)
10. paiements                — Suivi manuel virements (acompte/solde/commission)
11. factures                 — Factures PDF générées (url dans Supabase Storage)
12. etats_des_lieux          — EDL numériques signés (verrouillés après double signature)
13. documents                — Archivage légal 10 ans (archive_jusqu_au GENERATED)
14. evenements               — Événements BDE (optionnellement liés à une réservation)
15. formulaire_inscriptions  — Formulaire builder (champs en JSONB)
16. inscriptions             — Inscrits à un événement (reponses en JSONB)
17. inscription_echeances    — Échéances paiement libres définies par BDE
18. messages                 — Messagerie BDE ↔ Établissement ↔ Admin
19. notifications            — Notifications in-app (10 types, Supabase Realtime)
```

---

## Logique métier critique

### Workflow réservation (machine à états)
```
demande_devis créée
  → devis envoyé (statut: envoye)
  → devis signé YouSign (statut: signe)
  → reservation créée (statut: devis_signe)
  → acompte 30% virement BDE → Établissement
  → établissement coche "acompte reçu" (statut: acompte_confirme → confirmee)
  → RDV Cal.com effectué (rdv_effectue: true)
  → événement se déroule (statut: en_cours)
  → EDL entrée signé + EDL sortie signé
  → solde 70% virement BDE → Établissement
  → établissement coche "solde reçu"
  → commission virement Établissement → LINKHO
  → établissement coche "commission reversée"
  → admin confirme (statut: terminee)
```

### Paiements — référence virement unique
Format : `LINKHO-{numero_devis}-{TYPE}` (ex: `LINKHO-DV-2026-058-ACOMPTE`)
Affiché + copiable sur chaque facture. Obligatoire dans le libellé du virement.

### Commission
- Taux par établissement dans `etablissement_profiles.commission_rate`
- Snapshoté sur le devis à la création (trigger `set_devis_commission_rate`)
- Lecture seule pour l'établissement, modifiable uniquement par admin
- Chaque changement loggé dans `commission_rate_history` (trigger auto)

### Snapshot financier réservation
Quand une réservation est créée depuis un devis signé, TOUS les montants sont copiés
(montant_ttc, acompte, solde, commission_taux, commission_montant, caution_montant).
Ces valeurs ne changent jamais après création.

### Non-chevauchement dates établissement
INDEX GIST sur `reservations(etablissement_id, DATERANGE(date_debut, date_fin))`
WHERE statut NOT IN ('annulee').
Toujours vérifier la disponibilité AVANT de créer une réservation.

### Formulaire builder — structure JSONB
```typescript
type ChampFormulaire = {
  id: string           // ex: "field_1"
  type: 'text_court' | 'text_long' | 'email' | 'telephone' | 'date' |
        'nombre' | 'selection_unique' | 'selection_multiple' |
        'liste_deroulante' | 'oui_non' | 'fichier' | 'separateur'
  libelle: string
  obligatoire: boolean
  placeholder?: string
  aide?: string
  options?: string[]   // pour selection_unique, selection_multiple, liste_deroulante
  validation?: { min?: number; max?: number }
  ordre: number
}
```

### Archivage documents
`archive_jusqu_au` est une colonne GENERATED : `date_document + INTERVAL '10 years'`
Ne jamais calculer côté applicatif, toujours lire depuis la DB.

---

## Conventions TypeScript
```typescript
// Types Supabase — toujours utiliser les types générés
import type { Database } from '@/lib/types/supabase'
type Tables = Database['public']['Tables']
type Reservation = Tables['reservations']['Row']
type ReservationInsert = Tables['reservations']['Insert']

// Server Actions — toujours typer le retour
type ActionResult<T> = { data: T; error: null } | { data: null; error: string }

// Jamais de any — utiliser unknown si type inconnu
```

---

## Conventions nommage
- **Fichiers** : kebab-case (`devis-editor.tsx`, `use-reservations.ts`)
- **Composants** : PascalCase (`DevisEditor`, `ReservationTimeline`)
- **Server Actions** : camelCase dans `/src/lib/actions/` (`createDevis`, `confirmPaiement`)
- **Hooks** : `use` prefix (`useReservations`, `useNotifications`)
- **Tables Supabase** : snake_case (déjà défini dans le schéma)

---

## Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # serveur uniquement
RESEND_API_KEY=
YOUSIGN_API_KEY=
YOUSIGN_BASE_URL=https://api.yousign.app/v3
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_CAL_NAMESPACE=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Ce qui est en V2 (ne pas implémenter)
- Options événement (DJ, traiteur, navette, activités)
- Carte Mapbox sur le hero d'accueil
- Système d'avis / notation établissements
- Section Conseils (blog)
- Application mobile

---

## Git
```
main  → production stable
dev   → développement (branche courante)
```
Travailler sur `dev`, merger sur `main` quand une feature est validée et testée.