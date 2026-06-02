import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

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
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cell: { fontSize: 8.5, color: '#333' },
  totalsBox: { alignSelf: 'flex-end', width: '45%', marginTop: 12, marginBottom: 20 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: '3 8' },
  totalsRowBold: { flexDirection: 'row', justifyContent: 'space-between', padding: '5 8', backgroundColor: NAVY, borderRadius: 2, marginTop: 3 },
  conditionsBox: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 3, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  conditionsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  conditionsText: { fontSize: 7.5, color: '#555', lineHeight: 1.4 },
  virementsBox: { backgroundColor: '#f0f4ff', padding: 10, borderRadius: 3, marginBottom: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  virementsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  virementsRow: { flexDirection: 'row', marginBottom: 3 },
  virementsLabel: { fontSize: 8, color: '#666', width: 90 },
  virementsValue: { fontSize: 8, color: NAVY, fontFamily: 'Helvetica-Bold', flex: 1 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 6.5, color: '#999', textAlign: 'center', lineHeight: 1.4 },
  placeholder: { color: PLACEHOLDER_COLOR, fontFamily: 'Helvetica-Bold' },
})

function val(v: string | null | undefined): string {
  return v?.trim() || '[À COMPLÉTER]'
}

const fmtEuro = (n: number): string => {
  const [entier, decimales] = n.toFixed(2).split('.')
  const entierFormate = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${entierFormate},${decimales} €`
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s + 'T12:00:00')
  return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('/')
}

type EtabLegal = {
  nom: string
  adresse?: string | null
  ville?: string | null
  code_postal?: string | null
  telephone?: string | null
  email_contact?: string | null
  siret?: string | null
  forme_juridique?: string | null
  capital_social?: string | null
  tva_intracommunautaire?: string | null
  conditions_paiement?: string | null
  titulaire_compte?: string | null
  iban?: string | null
  bic?: string | null
}

type BdeInfo = { nom: string; ecole: string; ville?: string | null }

export type FacturePdfData = {
  etablissement: EtabLegal
  bde: BdeInfo
  factureNumero: string
  dateEmission: string
  type: 'acompte' | 'solde'
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  tva_taux: number
  evenement_nom: string
  evenement_date_debut?: string | null
  evenement_date_fin?: string | null
  reference_reservation: string
}

export function FacturePdf({ data }: { data: FacturePdfData }) {
  const { etablissement: etab, bde } = data
  const typeLabel = data.type === 'acompte' ? 'Facture d\'acompte' : 'Facture de solde'
  const designation = data.type === 'acompte'
    ? `Acompte — ${data.evenement_nom}`
    : `Solde — ${data.evenement_nom}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-têtes */}
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
            <Text style={[styles.headerLine, { marginTop: 4 }]}>SIRET : {val(etab.siret)}</Text>
            <Text style={styles.headerLine}>{val(etab.forme_juridique)}</Text>
            <Text style={styles.headerLine}>TVA : {val(etab.tva_intracommunautaire)}</Text>
          </View>

          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Client</Text>
            <Text style={styles.headerName}>{bde.nom}</Text>
            <Text style={styles.headerLine}>{bde.ecole}</Text>
            {bde.ville && <Text style={styles.headerLine}>{bde.ville}</Text>}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Titre */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{typeLabel.toUpperCase()} N° {data.factureNumero}</Text>
          <Text style={styles.titleSub}>
            Émise le {fmtDate(data.dateEmission)} — Réf. {data.reference_reservation}
          </Text>
        </View>

        {/* Objet */}
        <View style={[styles.conditionsBox, { marginBottom: 12 }]}>
          <Text style={styles.conditionsTitle}>Objet</Text>
          <Text style={styles.conditionsText}>
            {designation}
            {data.evenement_date_debut ? ` — du ${fmtDate(data.evenement_date_debut)}` : ''}
            {data.evenement_date_fin ? ` au ${fmtDate(data.evenement_date_fin)}` : ''}
          </Text>
        </View>

        {/* Tableau */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Désignation</Text>
          <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Montant HT</Text>
          <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'right' }]}>TVA</Text>
          <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Montant TTC</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 3 }]}>{designation}</Text>
          <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{fmtEuro(data.montant_ht)}</Text>
          <Text style={[styles.cell, { width: 50, textAlign: 'right' }]}>{Math.round(data.tva_taux * 100)}%</Text>
          <Text style={[styles.cell, { width: 80, textAlign: 'right' }]}>{fmtEuro(data.montant_ttc)}</Text>
        </View>

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>Montant HT</Text>
            <Text style={styles.cell}>{fmtEuro(data.montant_ht)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>TVA ({Math.round(data.tva_taux * 100)}%)</Text>
            <Text style={styles.cell}>{fmtEuro(data.montant_tva)}</Text>
          </View>
          <View style={styles.totalsRowBold}>
            <Text style={[styles.cell, { color: '#fff', fontFamily: 'Helvetica-Bold' }]}>Total TTC</Text>
            <Text style={[styles.cell, { color: BRAND, fontFamily: 'Helvetica-Bold' }]}>{fmtEuro(data.montant_ttc)}</Text>
          </View>
        </View>

        {/* Mentions obligatoires */}
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionsTitle}>Conditions de règlement</Text>
          <Text style={styles.conditionsText}>
            {etab.conditions_paiement ?? 'Modalités définies entre les parties.'}
          </Text>
          <Text style={[styles.conditionsText, { marginTop: 4, color: '#777' }]}>
            Numéro de facture unique : {data.factureNumero} — Date d&apos;exigibilité TVA : {fmtDate(data.dateEmission)}.
            Pénalités de retard : taux BCE majoré de 10 points (art. L441-10 C.Com.) — applicables le lendemain de la date d&apos;échéance.
            Indemnité forfaitaire de recouvrement : 40 €. Pas d&apos;escompte pour paiement anticipé.
          </Text>
        </View>

        {/* Modalités de règlement */}
        <View style={styles.virementsBox}>
          <Text style={styles.virementsTitle}>Modalités de règlement</Text>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>Titulaire :</Text>
            <Text style={etab.titulaire_compte ? styles.virementsValue : [styles.virementsValue, styles.placeholder]}>
              {etab.titulaire_compte ?? '[À COMPLÉTER]'}
            </Text>
          </View>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>IBAN :</Text>
            <Text style={etab.iban ? styles.virementsValue : [styles.virementsValue, styles.placeholder]}>
              {etab.iban ?? '[À COMPLÉTER]'}
            </Text>
          </View>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>BIC / SWIFT :</Text>
            <Text style={etab.bic ? styles.virementsValue : [styles.virementsValue, styles.placeholder]}>
              {etab.bic ?? '[À COMPLÉTER]'}
            </Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {etab.nom} — {val(etab.forme_juridique)} {etab.capital_social ? `— Capital : ${etab.capital_social}` : ''} — SIRET : {val(etab.siret)} — TVA : {val(etab.tva_intracommunautaire)}
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
