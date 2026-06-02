import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { bdeNom: string; montantTtc: number; demandeId: string }

export function DevisAccepteEmail({ bdeNom, montantTtc, demandeId }: Props) {
  return (
    <BaseLayout previewText={`${bdeNom} a accepté votre devis`}>
      <Text style={t.h1}>Devis accepté ✓</Text>
      <Text style={t.body}>
        <strong>{bdeNom}</strong> a accepté votre devis. La réservation est en cours de confirmation.
      </Text>
      <Hr style={t.divider} />
      <Text style={t.label}>Montant TTC</Text>
      <Text style={t.amount}>{fmtEuro(montantTtc)}</Text>
      <Text style={t.muted}>
        Suivez l&apos;avancement de la réservation depuis votre espace établissement.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/etablissement/demandes/${demandeId}`} style={t.btn}>
          Voir la demande
        </Button>
      </Section>
    </BaseLayout>
  )
}
