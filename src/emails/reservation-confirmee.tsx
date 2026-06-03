import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { bdeNom: string; dateDebut: string | null; dateFin: string | null; demandeId: string }

export function ReservationConfirmeeEmail({ bdeNom, dateDebut, dateFin, demandeId }: Props) {
  return (
    <BaseLayout previewText={`Réservation confirmée — ${bdeNom}`}>
      <Text style={t.h1}>Réservation confirmée</Text>
      <Text style={t.body}>
        <strong>{bdeNom}</strong> a confirmé sa réservation. L&apos;acompte est attendu selon les modalités convenues.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Dates de l&apos;événement</Text>
      <Text style={t.value}>{fmtDate(dateDebut)} → {fmtDate(dateFin)}</Text>
      <Text style={t.muted}>
        Suivez les paiements et gérez la réservation depuis votre espace établissement.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/etablissement/demandes/${demandeId}`} style={t.btn}>
          Voir la réservation
        </Button>
      </Section>
    </BaseLayout>
  )
}
