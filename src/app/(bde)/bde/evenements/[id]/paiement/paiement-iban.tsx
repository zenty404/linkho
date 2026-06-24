'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  ibanVirtuel: string
  reference: string
  montant: number
  evenementId: string
}

function fmtEuros(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-xs text-[var(--color-brand)] hover:underline font-medium"
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  )
}

export function PaiementIban({ ibanVirtuel, reference, montant, evenementId }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-navy)] p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Paiement de l&apos;acompte</h1>
          <p className="text-sm text-gray-500 mt-1">Effectuez un virement vers l&apos;IBAN ci-dessous</p>
        </div>

        <div className="text-4xl font-bold text-[var(--color-brand)]">
          {fmtEuros(montant)}
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Coordonnées bancaires</p>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Bénéficiaire</p>
              <p className="text-sm font-medium text-[var(--color-navy)]">LINKHO</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">IBAN</p>
              <p className="text-sm font-mono text-[var(--color-navy)] break-all">{ibanVirtuel}</p>
            </div>
            <CopyButton text={ibanVirtuel} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Référence à indiquer</p>
              <p className="text-sm font-mono text-[var(--color-navy)]">{reference}</p>
            </div>
            <CopyButton text={reference} />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            Votre virement sera automatiquement détecté par notre système. Délai : 1-3 jours ouvrés.
          </p>
        </div>

        <Link
          href={`/bde/evenements/${evenementId}`}
          className="inline-block text-center rounded-xl border border-[var(--color-navy)] text-[var(--color-navy)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-navy)] hover:text-white transition-colors"
        >
          Retour à mon événement
        </Link>
      </div>
    </div>
  )
}
