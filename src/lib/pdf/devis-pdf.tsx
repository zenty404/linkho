import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

// Couleurs
const NAVY = '#071634'
const BRAND = '#f49915'
const PLACEHOLDER_COLOR = '#dc2626'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  headerBox: { width: '48%' },
  headerLabel: { fontSize: 7, color: '#666', marginBottom: 2, textTransform: 'uppercase' },
  headerName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 },
  headerLine: { fontSize: 8.5, color: '#333', marginBottom: 1.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 16 },
  titleRow: { backgroundColor: NAVY, padding: '10 12', marginBottom: 16, borderRadius: 3 },
  titleText: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#fff' },
  titleSub: { fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY, padding: '5 8', marginBottom: 1 },
  tableHeaderCell: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { flexDirection: 'row', padding: '5 8', backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cell: { fontSize: 8.5, color: '#333' },
  totalsBox: { alignSelf: 'flex-end', width: '45%', marginTop: 12, marginBottom: 20 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '3 8' },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 8', backgroundColor: NAVY, borderRadius: 2, marginTop: 3 },
  conditionsBox: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 3, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  conditionsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  conditionsText: { fontSize: 7.5, color: '#555', lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 6.5, color: '#999', textAlign: 'center', lineHeight: 1.4 },
  placeholder: { color: PLACEHOLDER_COLOR, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 },
})

// Helper : affiche [À COMPLÉTER] en rouge si vide
function val(v: string | null | undefined, fallback = '[À COMPLÉTER]'): string {
  return v?.trim() || fallback
}

type EtabLegal = {
  nom: string
  adresse?: string | null
  ville?: string | null
  code_postal?: string | null
  telephone?: string | null
  email_contact?: string | null
  site_web?: string | null
  siret?: string | null
  forme_juridique?: string | null
  capital_social?: string | null
  tva_intracommunautaire?: string | null
  conditions_paiement?: string | null
  delai_validite_devis?: number | null
}

type BdeInfo = { nom: string; ecole: string; ville?: string | null }

type DevisItem = { libelle: string; quantite: number; prix_unitaire: number; description?: string | null }

export type DevisPdfData = {
  etablissement: EtabLegal
  bde: BdeInfo
  numero: string
  envoye_le: string | null
  sous_total_ht: number
  total_ttc: number | null
  tva_taux: number
  acompte_taux: number
  message_client?: string | null
  items: DevisItem[]
}

const fmtEuro = (n: number): string => {
  const [entier, decimales] = n.toFixed(2).split('.')
  const entierFormate = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${entierFormate},${decimales} €`
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function PlaceholderText({ v }: { v: string }) {
  const isPlaceholder = v === '[À COMPLÉTER]'
  return <Text style={isPlaceholder ? styles.placeholder : styles.cell}>{v}</Text>
}

export function DevisPdf({ data }: { data: DevisPdfData }) {
  const { etablissement: etab, bde, items } = data
  const delai = etab.delai_validite_devis ?? 30
  const acompte_montant = (data.total_ttc ?? 0) * data.acompte_taux
  const tva_montant = (data.total_ttc ?? 0) - data.sous_total_ht

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-tête double colonne */}
        <View style={styles.header}>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Émetteur</Text>
            <Text style={styles.headerName}>{etab.nom}</Text>
            {etab.adresse && <Text style={styles.headerLine}>{etab.adresse}</Text>}
            {(etab.code_postal || etab.ville) && (
              <Text style={styles.headerLine}>{[etab.code_postal, etab.ville].filter(Boolean).join(' ')}</Text>
            )}
            {etab.telephone && <Text style={styles.headerLine}>Tél : {etab.telephone}</Text>}
            {etab.email_contact && <Text style={styles.headerLine}>{etab.email_contact}</Text>}
            <Text style={[styles.headerLine, { marginTop: 4 }]}>
              SIRET : <PlaceholderText v={val(etab.siret)} />
            </Text>
            <Text style={styles.headerLine}>
              {val(etab.forme_juridique)} {etab.capital_social ? `— Capital ${etab.capital_social}` : ''}
            </Text>
            <Text style={styles.headerLine}>
              TVA : <PlaceholderText v={val(etab.tva_intracommunautaire)} />
            </Text>
          </View>

          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Destinataire</Text>
            <Text style={styles.headerName}>{bde.nom}</Text>
            <Text style={styles.headerLine}>{bde.ecole}</Text>
            {bde.ville && <Text style={styles.headerLine}>{bde.ville}</Text>}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Titre */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>DEVIS N° {data.numero}</Text>
          <Text style={styles.titleSub}>
            Émis le {fmtDate(data.envoye_le)} — Valable {delai} jours
          </Text>
        </View>

        {/* Tableau prestations */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
          <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'right' }]}>Qté</Text>
          <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>PU HT</Text>
          <Text style={[styles.tableHeaderCell, { width: 40, textAlign: 'right' }]}>TVA</Text>
          <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Total HT</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <View style={{ flex: 3 }}>
              <Text style={styles.cell}>{item.libelle}</Text>
              {item.description && <Text style={[styles.cell, { color: '#888', fontSize: 7.5 }]}>{item.description}</Text>}
            </View>
            <Text style={[styles.cell, { width: 40, textAlign: 'right' }]}>{item.quantite}</Text>
            <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{fmtEuro(item.prix_unitaire)}</Text>
            <Text style={[styles.cell, { width: 40, textAlign: 'right' }]}>{Math.round(data.tva_taux * 100)}%</Text>
            <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{fmtEuro(item.quantite * item.prix_unitaire)}</Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>Sous-total HT</Text>
            <Text style={styles.cell}>{fmtEuro(data.sous_total_ht)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>TVA ({Math.round(data.tva_taux * 100)}%)</Text>
            <Text style={styles.cell}>{fmtEuro(tva_montant)}</Text>
          </View>
          <View style={styles.totalsRowBold}>
            <Text style={[styles.cell, { color: '#fff', fontFamily: 'Helvetica-Bold' }]}>Total TTC</Text>
            <Text style={[styles.cell, { color: BRAND, fontFamily: 'Helvetica-Bold' }]}>{fmtEuro(data.total_ttc ?? 0)}</Text>
          </View>
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4 }]}>
            <Text style={[styles.cell, { color: '#555' }]}>Acompte demandé ({Math.round(data.acompte_taux * 100)}%)</Text>
            <Text style={[styles.cell, { color: '#555' }]}>{fmtEuro(acompte_montant)}</Text>
          </View>
        </View>

        {/* Message client */}
        {data.message_client && (
          <View style={[styles.conditionsBox, { marginBottom: 12 }]}>
            <Text style={styles.conditionsTitle}>Note de l&apos;établissement</Text>
            <Text style={styles.conditionsText}>{data.message_client}</Text>
          </View>
        )}

        {/* Conditions */}
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionsTitle}>Conditions de paiement</Text>
          <Text style={styles.conditionsText}>
            {etab.conditions_paiement ?? 'Modalités définies entre les parties.'}
          </Text>
          <Text style={[styles.conditionsText, { marginTop: 4, color: '#777' }]}>
            Pénalités de retard : taux BCE majoré de 10 points (art. L441-10 C.Com.) — applicables le lendemain de la date d&apos;échéance.
            Indemnité forfaitaire de recouvrement : 40 €. Pas d&apos;escompte pour paiement anticipé.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {etab.nom} — {etab.forme_juridique ?? ''} {etab.capital_social ? `— Capital : ${etab.capital_social}` : ''} — SIRET : {val(etab.siret)} — TVA : {val(etab.tva_intracommunautaire)}
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            {[etab.adresse, etab.code_postal, etab.ville].filter(Boolean).join(', ')}
            {etab.email_contact ? ` — ${etab.email_contact}` : ''}{etab.telephone ? ` — ${etab.telephone}` : ''}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
