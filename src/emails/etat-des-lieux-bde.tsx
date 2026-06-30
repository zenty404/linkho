import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

type Props = {
  type: 'arrivee' | 'depart'
  nomLieu: string
  signatureLink: string
}

export function EtatDesLieuxBdeEmail({ type, nomLieu, signatureLink }: Props) {
  const typeLabel = type === 'arrivee' ? "d'arrivée" : 'de départ'
  return (
    <BaseLayout previewText={`État des lieux ${typeLabel} à signer — ${nomLieu}`}>
      <Text style={t.h1}>État des lieux {typeLabel} à signer</Text>
      <Text style={t.body}>
        L&apos;établissement <strong>{nomLieu}</strong> a lancé l&apos;état des lieux {typeLabel}.
        Votre signature électronique est requise pour valider ce document.
      </Text>
      <Text style={t.muted}>
        Cliquez sur le bouton ci-dessous pour accéder à votre espace de signature sécurisé YouSign.
        L&apos;état des lieux sera considéré comme signé une fois les deux parties ayant apposé leur signature.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={signatureLink} style={t.btn}>
          Signer l&apos;état des lieux
        </Button>
      </Section>
    </BaseLayout>
  )
}
