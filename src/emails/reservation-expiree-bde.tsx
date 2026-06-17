import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = {
  etabNom: string
  bdeNom: string
  dateDebut: string
  dateFin: string
}

export function ReservationExpireeBdeEmail({ etabNom, bdeNom, dateDebut, dateFin }: Props) {
  return (
    <BaseLayout previewText={`Votre réservation avec ${etabNom} a expiré`}>
      <Text style={t.h1}>Votre réservation a expiré</Text>
      <Text style={t.body}>
        Bonjour <strong>{bdeNom}</strong>, le délai de 72h pour régler l&apos;acompte de votre
        réservation avec <strong>{etabNom}</strong> est dépassé.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Dates concernées</Text>
      <Text style={t.value}>
        {fmtDate(dateDebut)} → {fmtDate(dateFin)}
      </Text>
      <Text style={t.muted}>
        La réservation a été annulée automatiquement. Vous pouvez soumettre une nouvelle demande
        pour cet établissement ou en rechercher un autre.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/rechercher`} style={t.btn}>
          Rechercher un lieu
        </Button>
      </Section>
    </BaseLayout>
  )
}
