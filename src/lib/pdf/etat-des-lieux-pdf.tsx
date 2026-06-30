import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const CHECKLIST = [
  'État général des espaces et des locaux',
  'Propreté et hygiène des lieux',
  'Équipements présents et fonctionnels',
  'Éclairage et installations électriques',
  'Sanitaires et plomberie',
  'Mobilier et décoration',
  'Espaces extérieurs (terrasses, jardins, parkings)',
  'Dégâts ou dommages constatés',
]

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: '#1a1a1a', fontFamily: 'Helvetica' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#071634' },
  subtitle: { fontSize: 11, color: '#555555', marginBottom: 6 },
  badge: {
    backgroundColor: '#f49915',
    color: '#071634',
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  col: { flex: 1, paddingRight: 16 },
  label: { fontSize: 8, color: '#888888', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, color: '#071634', fontWeight: 'bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#071634', marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkBox: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  checkLabel: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  commentBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 12,
    minHeight: 70,
    marginTop: 6,
  },
  commentPlaceholder: { color: '#cccccc', fontSize: 9 },
  signatureRow: { flexDirection: 'row', marginTop: 32 },
  signatureBlock: { flex: 1, paddingTop: 10, marginRight: 16, borderTopWidth: 1, borderTopColor: '#d1d5db' },
  signatureRole: { fontSize: 8, color: '#888888', textTransform: 'uppercase', marginBottom: 2 },
  signatureName: { fontSize: 10, color: '#071634', fontWeight: 'bold' },
  signatureSpace: { height: 50 },
  footer: { fontSize: 8, color: '#9ca3af', marginTop: 32, textAlign: 'center' },
})

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type Props = {
  type: 'arrivee' | 'depart'
  nomLieu: string
  villeLieu: string | null
  nomBde: string
  nomEtab: string
  dateDebut: string | null
  dateFin: string | null
}

export function EtatDesLieuxPdf({ type, nomLieu, villeLieu, nomBde, nomEtab, dateDebut, dateFin }: Props) {
  const typeLabel = type === 'arrivee' ? 'Arrivee' : 'Depart'
  const typeLabelAccent = type === 'arrivee' ? "d'arrivee" : 'de depart'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Etat des lieux</Text>
        <Text style={styles.subtitle}>{nomLieu}{villeLieu ? `, ${villeLieu}` : ''}</Text>
        <View style={styles.badge}>
          <Text>Etat des lieux {typeLabelAccent}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>BDE</Text>
            <Text style={styles.value}>{nomBde}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Etablissement</Text>
            <Text style={styles.value}>{nomEtab}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Date de debut</Text>
            <Text style={styles.value}>{fmtDate(dateDebut)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Date de fin</Text>
            <Text style={styles.value}>{fmtDate(dateFin)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>Etat des lieux {typeLabel}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Date de realisation</Text>
            <Text style={styles.value}>{fmtDate(new Date().toISOString().split('T')[0])}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Points de verification</Text>

        {CHECKLIST.map((item, i) => (
          <View key={i} style={styles.checkItem}>
            <View style={styles.checkBox} />
            <Text style={styles.checkLabel}>{item}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Observations et commentaires</Text>
        <View style={styles.commentBox}>
          <Text style={styles.commentPlaceholder}>A remplir lors de l etat des lieux</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureRole}>Signature BDE</Text>
            <Text style={styles.signatureName}>{nomBde}</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureRole}>Date :</Text>
          </View>
          <View style={[styles.signatureBlock, { marginRight: 0 }]}>
            <Text style={styles.signatureRole}>Signature Etablissement</Text>
            <Text style={styles.signatureName}>{nomEtab}</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureRole}>Date :</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document genere par LINKHO — linkho.fr
        </Text>
      </Page>
    </Document>
  )
}
