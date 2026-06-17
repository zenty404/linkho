import { Hr, Text } from '@react-email/components'
import { BaseLayout, fmtDate, t } from './components/base-layout'

type Props = {
  etabNom: string
  bdeNom: string
  dateDebut: string
  dateFin: string
}

export function ReservationExpireeEtabEmail({ etabNom, bdeNom, dateDebut, dateFin }: Props) {
  return (
    <BaseLayout previewText={`La réservation avec ${bdeNom} a expiré — dates remises à disposition`}>
      <Text style={t.h1}>La réservation a expiré</Text>
      <Text style={t.body}>
        Bonjour <strong>{etabNom}</strong>, le BDE <strong>{bdeNom}</strong> n&apos;a pas réglé
        l&apos;acompte dans le délai imparti de 72h.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Dates concernées</Text>
      <Text style={t.value}>
        {fmtDate(dateDebut)} → {fmtDate(dateFin)}
      </Text>
      <Text style={t.muted}>
        La réservation est annulée et vos dates sont remises à disposition. Vous pouvez accepter de
        nouvelles demandes sur ces créneaux.
      </Text>
    </BaseLayout>
  )
}
