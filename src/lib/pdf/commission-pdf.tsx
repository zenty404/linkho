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
  virementsBox: { backgroundColor: '#f0f4ff', padding: 10, borderRadius: 3, marginBottom: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  virementsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  virementsRow: { flexDirection: 'row', marginBottom: 3 },
  virementsLabel: { fontSize: 8, color: '#666', width: 90 },
  virementsValue: { fontSize: 8, color: NAVY, fontFamily: 'Helvetica-Bold', flex: 1 },
  mentionsBox: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 3, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  mentionsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
  mentionsText: { fontSize: 7.5, color: '#555', lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 6.5, color: '#999', textAlign: 'center', lineHeight: 1.4 },
  placeholder: { color: PLACEHOLDER_COLOR, fontFamily: 'Helvetica-Bold' },
})

const fmtEuro = (n: number): string => {
  const [entier, decimales] = n.toFixed(2).split('.')
  const entierFormate = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${entierFormate},${decimales} €`
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s + 'T12:00:00')
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/')
}

function val(v: string | null | undefined): string {
  return v?.trim() || '[À COMPLÉTER]'
}

function isPlaceholder(v: string | null | undefined): boolean {
  const s = v?.trim() ?? ''
  return !s || s === '[À COMPLÉTER]'
}

export type CommissionPdfData = {
  linkho: {
    raison_sociale: string
    adresse: string
    code_postal: string
    ville: string
    siret: string
    tva_intracommunautaire: string
    iban: string
    bic: string
    email: string
  }
  etablissement: {
    nom: string
    adresse?: string | null
    code_postal?: string | null
    ville?: string | null
    siret?: string | null
    tva_intracommunautaire?: string | null
  }
  factureNumero: string
  dateEmission: string
  commission_montant: number
  date_debut: string | null
  date_fin: string | null
}

export function CommissionPdf({ data }: { data: CommissionPdfData }) {
  const { linkho, etablissement: etab } = data
  const commission_ht = data.commission_montant / 1.2
  const commission_tva = data.commission_montant - commission_ht

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* En-têtes */}
        <View style={styles.header}>
          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Émetteur</Text>
            <Text style={styles.headerName}>{val(linkho.raison_sociale)}</Text>
            {linkho.adresse && <Text style={styles.headerLine}>{linkho.adresse}</Text>}
            {(linkho.code_postal || linkho.ville) && (
              <Text style={styles.headerLine}>{[linkho.code_postal, linkho.ville].filter(Boolean).join(' ')}</Text>
            )}
            {linkho.email && <Text style={styles.headerLine}>{linkho.email}</Text>}
            <Text style={[styles.headerLine, { marginTop: 4 }]}>SIRET : {val(linkho.siret)}</Text>
            <Text style={styles.headerLine}>TVA : {val(linkho.tva_intracommunautaire)}</Text>
          </View>

          <View style={styles.headerBox}>
            <Text style={styles.headerLabel}>Destinataire</Text>
            <Text style={styles.headerName}>{etab.nom}</Text>
            {etab.adresse && <Text style={styles.headerLine}>{etab.adresse}</Text>}
            {(etab.code_postal || etab.ville) && (
              <Text style={styles.headerLine}>{[etab.code_postal, etab.ville].filter(Boolean).join(' ')}</Text>
            )}
            <Text style={[styles.headerLine, { marginTop: 4 }]}>SIRET : {val(etab.siret)}</Text>
            <Text style={styles.headerLine}>TVA : {val(etab.tva_intracommunautaire)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Titre */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>FACTURE DE COMMISSION N° LINKHO-{data.factureNumero}</Text>
          <Text style={styles.titleSub}>Émise le {fmtDate(data.dateEmission)}</Text>
        </View>

        {/* Tableau */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Désignation</Text>
          <Text style={[styles.tableHeaderCell, { width: 70, textAlign: 'right' }]}>Montant HT</Text>
          <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'right' }]}>TVA</Text>
          <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Montant TTC</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 3 }]}>
            {'Commission LINKHO — Événement du ' + fmtDate(data.date_debut) + ' au ' + fmtDate(data.date_fin)}
          </Text>
          <Text style={[styles.cell, { width: 70, textAlign: 'right' }]}>{fmtEuro(commission_ht)}</Text>
          <Text style={[styles.cell, { width: 50, textAlign: 'right' }]}>20%</Text>
          <Text style={[styles.cell, { width: 80, textAlign: 'right' }]}>{fmtEuro(data.commission_montant)}</Text>
        </View>

        {/* Totaux */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>Montant HT</Text>
            <Text style={styles.cell}>{fmtEuro(commission_ht)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.cell}>TVA 20%</Text>
            <Text style={styles.cell}>{fmtEuro(commission_tva)}</Text>
          </View>
          <View style={styles.totalsRowBold}>
            <Text style={[styles.cell, { color: '#fff', fontFamily: 'Helvetica-Bold' }]}>Total TTC</Text>
            <Text style={[styles.cell, { color: BRAND, fontFamily: 'Helvetica-Bold' }]}>{fmtEuro(data.commission_montant)}</Text>
          </View>
        </View>

        {/* Modalités de règlement */}
        <View style={styles.virementsBox}>
          <Text style={styles.virementsTitle}>Modalités de règlement</Text>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>Titulaire :</Text>
            <Text style={styles.virementsValue}>{val(linkho.raison_sociale)}</Text>
          </View>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>IBAN :</Text>
            <Text
              style={isPlaceholder(linkho.iban)
                ? [styles.virementsValue, styles.placeholder]
                : styles.virementsValue}
            >
              {val(linkho.iban)}
            </Text>
          </View>
          <View style={styles.virementsRow}>
            <Text style={styles.virementsLabel}>BIC / SWIFT :</Text>
            <Text
              style={isPlaceholder(linkho.bic)
                ? [styles.virementsValue, styles.placeholder]
                : styles.virementsValue}
            >
              {val(linkho.bic)}
            </Text>
          </View>
        </View>

        {/* Mentions légales */}
        <View style={styles.mentionsBox}>
          <Text style={styles.mentionsTitle}>Mentions légales</Text>
          <Text style={styles.mentionsText}>
            Numéro de facture unique : LINKHO-{data.factureNumero} — Date d&apos;exigibilité TVA : {fmtDate(data.dateEmission)}.
            {'\n'}Pénalités de retard : taux BCE majoré de 10 points (art. L441-10 C.Com.) — applicables le lendemain de la date d&apos;échéance.
            {'\n'}Indemnité forfaitaire de recouvrement : 40 €. Pas d&apos;escompte pour paiement anticipé.
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {val(linkho.raison_sociale)} — SIRET : {val(linkho.siret)} — TVA : {val(linkho.tva_intracommunautaire)}
          </Text>
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            {[linkho.adresse, linkho.code_postal, linkho.ville].filter(Boolean).join(', ')}
            {linkho.email ? ` — ${linkho.email}` : ''}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
