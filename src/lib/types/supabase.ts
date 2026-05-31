export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bde_profiles: {
        Row: {
          actif: boolean
          created_at: string
          ecole: string
          id: string
          logo_url: string | null
          nom: string
          telephone: string | null
          updated_at: string
          user_id: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          ecole: string
          id?: string
          logo_url?: string | null
          nom: string
          telephone?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          ecole?: string
          id?: string
          logo_url?: string | null
          nom?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bde_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rate_history: {
        Row: {
          ancien_taux: number
          created_at: string
          etablissement_id: string
          id: string
          modifie_par: string
          note: string | null
          nouveau_taux: number
        }
        Insert: {
          ancien_taux: number
          created_at?: string
          etablissement_id: string
          id?: string
          modifie_par: string
          note?: string | null
          nouveau_taux: number
        }
        Update: {
          ancien_taux?: number
          created_at?: string
          etablissement_id?: string
          id?: string
          modifie_par?: string
          note?: string | null
          nouveau_taux?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rate_history_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rate_history_modifie_par_fkey"
            columns: ["modifie_par"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_devis: {
        Row: {
          bde_id: string
          created_at: string
          date_debut: string
          date_fin: string
          etablissement_id: string
          id: string
          message: string | null
          nb_participants: number
          statut: string
          type_evenement: string
          updated_at: string
        }
        Insert: {
          bde_id: string
          created_at?: string
          date_debut: string
          date_fin: string
          etablissement_id: string
          id?: string
          message?: string | null
          nb_participants: number
          statut?: string
          type_evenement: string
          updated_at?: string
        }
        Update: {
          bde_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string
          etablissement_id?: string
          id?: string
          message?: string | null
          nb_participants?: number
          statut?: string
          type_evenement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_devis_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_devis_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          acompte_montant: number | null
          acompte_taux: number
          bde_id: string
          commission_montant: number | null
          commission_taux: number
          created_at: string
          date_evenement_debut: string
          date_evenement_fin: string
          demande_id: string
          envoye_le: string | null
          etablissement_id: string
          id: string
          message_client: string | null
          nb_participants: number
          numero: string
          signe_le: string | null
          solde_montant: number | null
          sous_total_ht: number
          statut: string
          total_ttc: number | null
          tva_montant: number | null
          tva_taux: number
          updated_at: string
          yousign_document_id: string | null
          yousign_signature_url: string | null
        }
        Insert: {
          acompte_montant?: number | null
          acompte_taux?: number
          bde_id: string
          commission_montant?: number | null
          commission_taux: number
          created_at?: string
          date_evenement_debut: string
          date_evenement_fin: string
          demande_id: string
          envoye_le?: string | null
          etablissement_id: string
          id?: string
          message_client?: string | null
          nb_participants: number
          numero: string
          signe_le?: string | null
          solde_montant?: number | null
          sous_total_ht?: number
          statut?: string
          total_ttc?: number | null
          tva_montant?: number | null
          tva_taux?: number
          updated_at?: string
          yousign_document_id?: string | null
          yousign_signature_url?: string | null
        }
        Update: {
          acompte_montant?: number | null
          acompte_taux?: number
          bde_id?: string
          commission_montant?: number | null
          commission_taux?: number
          created_at?: string
          date_evenement_debut?: string
          date_evenement_fin?: string
          demande_id?: string
          envoye_le?: string | null
          etablissement_id?: string
          id?: string
          message_client?: string | null
          nb_participants?: number
          numero?: string
          signe_le?: string | null
          solde_montant?: number | null
          sous_total_ht?: number
          statut?: string
          total_ttc?: number | null
          tva_montant?: number | null
          tva_taux?: number
          updated_at?: string
          yousign_document_id?: string | null
          yousign_signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devis_items: {
        Row: {
          created_at: string
          description: string | null
          devis_id: string
          id: string
          libelle: string
          ordre: number | null
          prix_unitaire: number
          quantite: number
          total: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          devis_id: string
          id?: string
          libelle: string
          ordre?: number | null
          prix_unitaire: number
          quantite?: number
          total?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          devis_id?: string
          id?: string
          libelle?: string
          ordre?: number | null
          prix_unitaire?: number
          quantite?: number
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_items_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          archive_jusqu_au: string | null
          bde_id: string | null
          created_at: string
          date_document: string
          devis_id: string | null
          etablissement_id: string | null
          etat_des_lieux_id: string | null
          facture_id: string | null
          id: string
          nom: string
          reservation_id: string | null
          statut_archive: string
          taille_bytes: number | null
          type: string
          url: string
        }
        Insert: {
          archive_jusqu_au?: string | null
          bde_id?: string | null
          created_at?: string
          date_document?: string
          devis_id?: string | null
          etablissement_id?: string | null
          etat_des_lieux_id?: string | null
          facture_id?: string | null
          id?: string
          nom: string
          reservation_id?: string | null
          statut_archive?: string
          taille_bytes?: number | null
          type: string
          url: string
        }
        Update: {
          archive_jusqu_au?: string | null
          bde_id?: string | null
          created_at?: string
          date_document?: string
          devis_id?: string | null
          etablissement_id?: string | null
          etat_des_lieux_id?: string | null
          facture_id?: string | null
          id?: string
          nom?: string
          reservation_id?: string | null
          statut_archive?: string
          taille_bytes?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etats_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissement_photos: {
        Row: {
          created_at: string
          est_principale: boolean | null
          etablissement_id: string
          id: string
          ordre: number | null
          url: string
        }
        Insert: {
          created_at?: string
          est_principale?: boolean | null
          etablissement_id: string
          id?: string
          ordre?: number | null
          url: string
        }
        Update: {
          created_at?: string
          est_principale?: boolean | null
          etablissement_id?: string
          id?: string
          ordre?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "etablissement_photos_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissement_profiles: {
        Row: {
          actif: boolean
          adresse: string | null
          capacite_max: number | null
          code_postal: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          email_contact: string | null
          equip_bar: boolean | null
          equip_cuisine: boolean | null
          equip_exterieur: boolean | null
          equip_parking: boolean | null
          equip_piscine: boolean | null
          equip_salle_soiree: boolean | null
          equip_sonorisation: boolean | null
          equip_wifi: boolean | null
          iban: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nb_chambres: number | null
          nb_couchages: number | null
          nb_salles_de_bain: number | null
          nom: string
          prix_base: number | null
          site_web: string | null
          slug: string | null
          superficie_m2: number | null
          telephone: string | null
          updated_at: string
          user_id: string
          ville: string | null
          visible: boolean
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          capacite_max?: number | null
          code_postal?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          email_contact?: string | null
          equip_bar?: boolean | null
          equip_cuisine?: boolean | null
          equip_exterieur?: boolean | null
          equip_parking?: boolean | null
          equip_piscine?: boolean | null
          equip_salle_soiree?: boolean | null
          equip_sonorisation?: boolean | null
          equip_wifi?: boolean | null
          iban?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nb_chambres?: number | null
          nb_couchages?: number | null
          nb_salles_de_bain?: number | null
          nom: string
          prix_base?: number | null
          site_web?: string | null
          slug?: string | null
          superficie_m2?: number | null
          telephone?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
          visible?: boolean
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          capacite_max?: number | null
          code_postal?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          email_contact?: string | null
          equip_bar?: boolean | null
          equip_cuisine?: boolean | null
          equip_exterieur?: boolean | null
          equip_parking?: boolean | null
          equip_piscine?: boolean | null
          equip_salle_soiree?: boolean | null
          equip_sonorisation?: boolean | null
          equip_wifi?: boolean | null
          iban?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nb_chambres?: number | null
          nb_couchages?: number | null
          nb_salles_de_bain?: number | null
          nom?: string
          prix_base?: number | null
          site_web?: string | null
          slug?: string | null
          superficie_m2?: number | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "etablissement_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      etats_des_lieux: {
        Row: {
          created_at: string
          dommages_description: string | null
          dommages_signales: boolean | null
          dommages_signales_le: string | null
          id: string
          observations: string | null
          photos_urls: string[] | null
          reservation_id: string
          signe_par_bde: boolean | null
          signe_par_bde_le: string | null
          signe_par_gerant: boolean | null
          signe_par_gerant_le: string | null
          type: string
          updated_at: string
          verrouille: boolean | null
          verrouille_le: string | null
          yousign_document_id: string | null
        }
        Insert: {
          created_at?: string
          dommages_description?: string | null
          dommages_signales?: boolean | null
          dommages_signales_le?: string | null
          id?: string
          observations?: string | null
          photos_urls?: string[] | null
          reservation_id: string
          signe_par_bde?: boolean | null
          signe_par_bde_le?: string | null
          signe_par_gerant?: boolean | null
          signe_par_gerant_le?: string | null
          type: string
          updated_at?: string
          verrouille?: boolean | null
          verrouille_le?: string | null
          yousign_document_id?: string | null
        }
        Update: {
          created_at?: string
          dommages_description?: string | null
          dommages_signales?: boolean | null
          dommages_signales_le?: string | null
          id?: string
          observations?: string | null
          photos_urls?: string[] | null
          reservation_id?: string
          signe_par_bde?: boolean | null
          signe_par_bde_le?: string | null
          signe_par_gerant?: boolean | null
          signe_par_gerant_le?: string | null
          type?: string
          updated_at?: string
          verrouille?: boolean | null
          verrouille_le?: string | null
          yousign_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etats_des_lieux_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          bde_id: string
          created_at: string
          date_debut: string | null
          date_fin: string | null
          description: string | null
          id: string
          nb_places_max: number | null
          nom: string
          reservation_id: string | null
          statut: string
          type: string
          updated_at: string
        }
        Insert: {
          bde_id: string
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          nb_places_max?: number | null
          nom: string
          reservation_id?: string | null
          statut?: string
          type: string
          updated_at?: string
        }
        Update: {
          bde_id?: string
          created_at?: string
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          nb_places_max?: number | null
          nom?: string
          reservation_id?: string | null
          statut?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          created_at: string
          emise_le: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          paiement_id: string | null
          pdf_url: string | null
          reservation_id: string
          type: string
        }
        Insert: {
          created_at?: string
          emise_le?: string
          id?: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero: string
          paiement_id?: string | null
          pdf_url?: string | null
          reservation_id: string
          type: string
        }
        Update: {
          created_at?: string
          emise_le?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero?: string
          paiement_id?: string | null
          pdf_url?: string | null
          reservation_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: false
            referencedRelation: "paiements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      formulaire_inscriptions: {
        Row: {
          bde_id: string
          champs: Json
          created_at: string
          description: string | null
          evenement_id: string
          id: string
          prix_total: number | null
          publie: boolean
          publie_le: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          bde_id: string
          champs?: Json
          created_at?: string
          description?: string | null
          evenement_id: string
          id?: string
          prix_total?: number | null
          publie?: boolean
          publie_le?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          bde_id?: string
          champs?: Json
          created_at?: string
          description?: string | null
          evenement_id?: string
          id?: string
          prix_total?: number | null
          publie?: boolean
          publie_le?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulaire_inscriptions_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulaire_inscriptions_evenement_id_fkey"
            columns: ["evenement_id"]
            isOneToOne: true
            referencedRelation: "evenements"
            referencedColumns: ["id"]
          },
        ]
      }
      inscription_echeances: {
        Row: {
          created_at: string
          date_echeance: string | null
          id: string
          inscription_id: string
          montant: number
          numero: number
          paye: boolean
          paye_le: string | null
        }
        Insert: {
          created_at?: string
          date_echeance?: string | null
          id?: string
          inscription_id: string
          montant: number
          numero: number
          paye?: boolean
          paye_le?: string | null
        }
        Update: {
          created_at?: string
          date_echeance?: string | null
          id?: string
          inscription_id?: string
          montant?: number
          numero?: number
          paye?: boolean
          paye_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscription_echeances_inscription_id_fkey"
            columns: ["inscription_id"]
            isOneToOne: false
            referencedRelation: "inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      inscriptions: {
        Row: {
          bde_id: string
          caution_montant: number | null
          caution_payee: boolean
          created_at: string
          email: string
          evenement_id: string
          formulaire_id: string
          id: string
          montant_total: number
          nom: string
          prenom: string
          reponses: Json
          statut: string
          statut_paiement: string
          updated_at: string
        }
        Insert: {
          bde_id: string
          caution_montant?: number | null
          caution_payee?: boolean
          created_at?: string
          email: string
          evenement_id: string
          formulaire_id: string
          id?: string
          montant_total?: number
          nom: string
          prenom: string
          reponses?: Json
          statut?: string
          statut_paiement?: string
          updated_at?: string
        }
        Update: {
          bde_id?: string
          caution_montant?: number | null
          caution_payee?: boolean
          created_at?: string
          email?: string
          evenement_id?: string
          formulaire_id?: string
          id?: string
          montant_total?: number
          nom?: string
          prenom?: string
          reponses?: Json
          statut?: string
          statut_paiement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscriptions_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_evenement_id_fkey"
            columns: ["evenement_id"]
            isOneToOne: false
            referencedRelation: "evenements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscriptions_formulaire_id_fkey"
            columns: ["formulaire_id"]
            isOneToOne: false
            referencedRelation: "formulaire_inscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contenu: string
          created_at: string
          demande_id: string | null
          destinataire_id: string
          expediteur_id: string
          id: string
          lu: boolean
          lu_le: string | null
          reservation_id: string | null
        }
        Insert: {
          contenu: string
          created_at?: string
          demande_id?: string | null
          destinataire_id: string
          expediteur_id: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          reservation_id?: string | null
        }
        Update: {
          contenu?: string
          created_at?: string
          demande_id?: string | null
          destinataire_id?: string
          expediteur_id?: string
          id?: string
          lu?: boolean
          lu_le?: string | null
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          contenu: string | null
          created_at: string
          devis_id: string | null
          id: string
          lien: string | null
          lu: boolean
          lu_le: string | null
          reservation_id: string | null
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          devis_id?: string | null
          id?: string
          lien?: string | null
          lu?: boolean
          lu_le?: string | null
          reservation_id?: string | null
          titre: string
          type: string
          user_id: string
        }
        Update: {
          contenu?: string | null
          created_at?: string
          devis_id?: string | null
          id?: string
          lien?: string | null
          lu?: boolean
          lu_le?: string | null
          reservation_id?: string | null
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          confirme: boolean
          confirme_le: string | null
          confirme_par: string | null
          created_at: string
          id: string
          montant: number
          note: string | null
          reference_virement: string
          reservation_id: string
          type: string
          updated_at: string
        }
        Insert: {
          confirme?: boolean
          confirme_le?: string | null
          confirme_par?: string | null
          created_at?: string
          id?: string
          montant: number
          note?: string | null
          reference_virement: string
          reservation_id: string
          type: string
          updated_at?: string
        }
        Update: {
          confirme?: boolean
          confirme_le?: string | null
          confirme_par?: string | null
          created_at?: string
          id?: string
          montant?: number
          note?: string | null
          reference_virement?: string
          reservation_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_confirme_par_fkey"
            columns: ["confirme_par"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          acompte_montant: number
          bde_id: string
          caution_montant: number | null
          commission_montant: number
          commission_taux: number
          created_at: string
          date_debut: string
          date_fin: string
          devis_id: string
          etablissement_id: string
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          nb_participants: number
          rdv_date: string | null
          rdv_effectue: boolean | null
          reference: string
          solde_montant: number
          statut: string
          updated_at: string
        }
        Insert: {
          acompte_montant: number
          bde_id: string
          caution_montant?: number | null
          commission_montant: number
          commission_taux: number
          created_at?: string
          date_debut: string
          date_fin: string
          devis_id: string
          etablissement_id: string
          id?: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          nb_participants: number
          rdv_date?: string | null
          rdv_effectue?: boolean | null
          reference: string
          solde_montant: number
          statut?: string
          updated_at?: string
        }
        Update: {
          acompte_montant?: number
          bde_id?: string
          caution_montant?: number | null
          commission_montant?: number
          commission_taux?: number
          created_at?: string
          date_debut?: string
          date_fin?: string
          devis_id?: string
          etablissement_id?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          nb_participants?: number
          rdv_date?: string | null
          rdv_effectue?: boolean | null
          reference?: string
          solde_montant?: number
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_bde_id_fkey"
            columns: ["bde_id"]
            isOneToOne: false
            referencedRelation: "bde_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissement_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_bde_id: { Args: never; Returns: string }
      get_etablissement_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
