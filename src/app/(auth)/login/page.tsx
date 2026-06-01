import LoginForm from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; action?: string }>
}) {
  const sp = await searchParams
  const redirectUrl = typeof sp.redirect === 'string' ? sp.redirect : ''
  const action = typeof sp.action === 'string' ? sp.action : ''

  return <LoginForm redirect={redirectUrl} action={action} />
}
