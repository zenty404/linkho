'use client'

import { useState, useEffect } from 'react'

type Props = { expireAt: string }

function getTimeLeft(expireAt: string) {
  const diff = new Date(expireAt).getTime() - Date.now()
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true }
  const totalMinutes = Math.floor(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes, expired: false }
}

export function CountdownTimer({ expireAt }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(expireAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expireAt))
    }, 60000)
    return () => clearInterval(interval)
  }, [expireAt])

  if (timeLeft.expired) {
    return <span className="text-sm font-bold text-red-600">Délai expiré</span>
  }

  const totalHours = timeLeft.hours
  const colorClass =
    totalHours < 24 ? 'text-red-600' : totalHours < 48 ? 'text-orange-500' : 'text-navy'

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`text-sm font-bold ${colorClass}`}>
        {timeLeft.hours} h {String(timeLeft.minutes).padStart(2, '0')} min
      </span>
      {totalHours < 24 && (
        <p className="text-xs text-red-600 font-medium">⚠ Moins de 24h pour régler l&apos;acompte</p>
      )}
    </div>
  )
}
