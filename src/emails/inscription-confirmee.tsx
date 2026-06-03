import { Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t, NAVY } from './components/base-layout'

type Props = {
  evenementNom: string
  dateDebut: string | null
  dateFin: string | null
  lieuNom: string
  reponses: Record<string, unknown>
}

export function InscriptionConfirmeeEmail({ evenementNom, dateDebut, dateFin, lieuNom, reponses }: Props) {
  const reponsesEntries = Object.entries(reponses).filter(([, v]) => v !== undefined && v !== '')

  return (
    <BaseLayout previewText={`Inscription confirmée — ${evenementNom}`}>
      <Text style={t.h1}>Inscription confirmée ✓</Text>
      <Text style={t.body}>
        Votre inscription à <strong>{evenementNom}</strong> a bien été enregistrée.
      </Text>
      <Hr style={t.divider} />
      {lieuNom && (
        <>
          <Text style={t.label}>Lieu</Text>
          <Text style={t.value}>{lieuNom}</Text>
        </>
      )}
      <Text style={t.label}>Dates</Text>
      <Text style={t.value}>{fmtDate(dateDebut)}{dateFin ? ` → ${fmtDate(dateFin)}` : ''}</Text>

      {reponsesEntries.length > 0 && (
        <>
          <Hr style={t.divider} />
          <Text style={{ ...t.label, marginBottom: '12px' }}>Récapitulatif de vos réponses</Text>
          {reponsesEntries.map(([key, value]) => (
            <Section key={key} style={{ marginBottom: '8px' }}>
              <Text style={{ ...t.label, margin: '0 0 2px 0' }}>{key}</Text>
              <Text style={{ fontSize: '14px', color: NAVY, margin: '0' }}>
                {Array.isArray(value) ? (value as string[]).join(', ') : String(value)}
              </Text>
            </Section>
          ))}
        </>
      )}

      <Hr style={t.divider} />
      <Text style={t.muted}>
        Conservez cet email comme confirmation de votre inscription.
        Pour toute question, contactez directement votre BDE.
      </Text>
    </BaseLayout>
  )
}
