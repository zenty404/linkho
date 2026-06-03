import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'

export function BaseLayout({ children, previewText = '' }: { children: ReactNode; previewText?: string }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#f5f5f5', fontFamily: 'Helvetica, Arial, sans-serif', margin: '0', padding: '40px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', maxWidth: '600px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}>
          <Section style={{ backgroundColor: '#071634', padding: '20px 32px', borderBottom: '4px solid #f49915' }}>
            <Text style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '3px' }}>
              LINKHO
            </Text>
          </Section>
          <Section style={{ padding: '32px' }}>
            {children}
          </Section>
          <Hr style={{ borderColor: '#e5e7eb', margin: '0' }} />
          <Section style={{ backgroundColor: '#f9fafb', padding: '16px 32px' }}>
            <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '0', textAlign: 'center' as const }}>
              © 2026 LINKHO — La plateforme des événements étudiants
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const NAVY = '#071634'
export const BRAND = '#f49915'

export const t = {
  h1: { fontSize: '20px', fontWeight: '700', color: NAVY, margin: '0 0 16px 0' },
  body: { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 12px 0' },
  muted: { fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' },
  label: { fontSize: '12px', color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  value: { fontSize: '15px', color: NAVY, fontWeight: '600', margin: '0 0 12px 0' },
  amount: { fontSize: '24px', fontWeight: '800', color: BRAND, margin: '0 0 16px 0' },
  btn: { backgroundColor: BRAND, color: NAVY, padding: '12px 24px', borderRadius: '6px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', display: 'inline-block' },
  divider: { borderColor: '#e5e7eb', margin: '20px 0' },
}

export function fmtEuro(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s.includes('T') ? s : s + 'T12:00:00')
  return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('/')
}
