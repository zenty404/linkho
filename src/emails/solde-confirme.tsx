import { Button, Hr, Section, Text } from '@react-email/components'
import { BaseLayout, fmtEuro, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

type Props = { evenementNom: string; montantSolde: number; evenementId: string }

export function SoldeConfirmeEmail({ evenementNom, montantSolde, evenementId }: Props) {
  return (
    <BaseLayout previewText={`Solde confirmé — ${evenementNom}`}>
      <Text style={t.h1}>Solde confirmé ✅</Text>
      <Text style={t.body}>
        Votre solde de <strong>{fmtEuro(montantSolde)}</strong> a bien été reçu pour{' '}
        <strong>{evenementNom}</strong>. Votre réservation est clôturée.
      </Text>
      <Hr style={t.divider} />
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/bde/evenements/${evenementId}`} style={t.btn}>
          Voir mon événement
        </Button>
      </Section>
    </BaseLayout>
  )
}
