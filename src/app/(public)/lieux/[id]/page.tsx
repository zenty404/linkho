import { notFound } from 'next/navigation'
import { getLieuById, getReservationsOccupees } from '@/lib/actions/public'
import LieuDetailClient from './lieu-detail-client'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams

  const lieu = await getLieuById(id)
  if (!lieu) notFound()

  const reservationsOccupees = await getReservationsOccupees(id)

  const date_debut = typeof sp.date_debut === 'string' ? sp.date_debut : ''
  const date_fin = typeof sp.date_fin === 'string' ? sp.date_fin : ''
  const participants = typeof sp.participants === 'string' ? sp.participants : ''

  return (
    <LieuDetailClient
      lieu={lieu}
      reservationsOccupees={reservationsOccupees}
      initialDates={{ date_debut, date_fin, participants }}
    />
  )
}
