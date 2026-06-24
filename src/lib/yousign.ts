export const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY!
export const YOUSIGN_BASE_URL = process.env.YOUSIGN_BASE_URL ?? 'https://api-sandbox.yousign.app/v3'

export async function yousignFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${YOUSIGN_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`YouSign API error ${res.status}: ${error}`)
  }
  return res.json()
}
