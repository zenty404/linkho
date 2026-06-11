import { Button, Section, Text } from '@react-email/components'
import { BaseLayout, t } from './components/base-layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.linkho.fr'

export function CompteValideEmail() {
  return (
    <BaseLayout previewText="Votre compte LINKHO a été activé — connectez-vous dès maintenant">
      <Text style={t.h1}>Votre compte est activé !</Text>
      <Text style={t.body}>
        Bonne nouvelle ! L&apos;équipe LINKHO a validé votre compte.
        Vous pouvez dès à présent vous connecter et accéder à la plateforme.
      </Text>
      <Text style={t.muted}>
        Si vous avez des questions, n&apos;hésitez pas à nous contacter à{' '}
        <a href="mailto:support@linkho.fr" style={{ color: '#f49915' }}>support@linkho.fr</a>.
      </Text>
      <Section style={{ marginTop: '24px' }}>
        <Button href={`${APP_URL}/login`} style={t.btn}>
          Se connecter
        </Button>
      </Section>
    </BaseLayout>
  )
}
