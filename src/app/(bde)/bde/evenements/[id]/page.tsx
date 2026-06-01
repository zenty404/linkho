import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEvenementById } from '@/lib/actions/evenements'
import { getFormulaireByEvenement, creerFormulaire } from '@/lib/actions/formulaires'

const TYPE_LABELS: Record<string, string> = {
  soiree: 'Soirée', gala: 'Gala', wei: 'WEI', voyage: 'Voyage',
  sportif: 'Sportif', culturel: 'Culturel', conference: 'Conférence',
  atelier: 'Atelier', autre: 'Autre',
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

type Props = { params: Promise<{ id: string }> }

export default async function EvenementDetailPage({ params }: Props) {
  const { id } = await params

  const [evenementResult, formulaireResult] = await Promise.all([
    getEvenementById(id),
    getFormulaireByEvenement(id),
  ])

  if (evenementResult.error || !evenementResult.data) notFound()

  const evenement = evenementResult.data
  const formulaire = formulaireResult.data

  async function handleCreerFormulaire(_: FormData) {
    'use server'
    const res = await creerFormulaire(id)
    if (res.data) {
      const { redirect } = await import('next/navigation')
      redirect(`/bde/formulaires/${res.data.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-navy">{evenement.nom}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {TYPE_LABELS[evenement.type] ?? evenement.type}
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full capitalize">
            {evenement.statut}
          </span>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Informations
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Date de début</p>
            <p className="text-sm font-medium text-navy">{fmtDate(evenement.date_debut)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Date de fin</p>
            <p className="text-sm font-medium text-navy">{fmtDate(evenement.date_fin)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Places maximum</p>
            <p className="text-sm font-medium text-navy">{evenement.nb_places_max ?? '—'}</p>
          </div>
          {evenement.description && (
            <div className="col-span-3">
              <p className="text-xs text-gray-400 mb-0.5">Description</p>
              <p className="text-sm text-gray-700">{evenement.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'inscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Formulaire d&apos;inscription
        </h2>

        {formulaire ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">{formulaire.titre}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(formulaire.champs as unknown[])?.length ?? 0} champ{((formulaire.champs as unknown[])?.length ?? 0) > 1 ? 's' : ''} •{' '}
                {formulaire.publie ? (
                  <span className="text-emerald-600 font-medium">Publié</span>
                ) : (
                  <span className="text-amber-600 font-medium">Brouillon</span>
                )}
              </p>
            </div>
            <Link
              href={`/bde/formulaires/${formulaire.id}`}
              className="px-4 py-2 text-sm font-semibold text-navy border border-navy rounded-lg hover:bg-navy/5 transition-colors"
            >
              Gérer le formulaire
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Aucun formulaire d&apos;inscription créé.</p>
            <form action={handleCreerFormulaire}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-light rounded-lg transition-colors"
              >
                Créer le formulaire
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
