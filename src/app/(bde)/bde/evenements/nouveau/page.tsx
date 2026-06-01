import { creerEvenement } from '@/lib/actions/evenements'

const EVENT_TYPES = [
  { value: 'soiree', label: 'Soirée' },
  { value: 'gala', label: 'Gala' },
  { value: 'wei', label: "Week-end d'intégration (WEI)" },
  { value: 'voyage', label: 'Voyage' },
  { value: 'sportif', label: 'Événement sportif' },
  { value: 'culturel', label: 'Événement culturel' },
  { value: 'conference', label: 'Conférence' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'autre', label: 'Autre' },
]

export default async function NouvelEvenementPage() {
  async function handleSubmit(_: FormData) {
    'use server'
    await creerEvenement(_)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold text-navy mb-5">Créer un événement</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom de l&apos;événement *
            </label>
            <input
              id="nom"
              name="nom"
              required
              placeholder="Soirée de rentrée 2026"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">
              Type *
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
            >
              <option value="">Sélectionner un type...</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-1.5">
                Date de début
              </label>
              <input
                id="date_debut"
                name="date_debut"
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-1.5">
                Date de fin
              </label>
              <input
                id="date_fin"
                name="date_fin"
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label htmlFor="nb_places_max" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre de places maximum
            </label>
            <input
              id="nb_places_max"
              name="nb_places_max"
              type="number"
              min="1"
              placeholder="100"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Décrivez votre événement..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          <button
            type="submit"
            className="self-start mt-1 px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Créer l&apos;événement
          </button>
        </form>
      </div>
    </div>
  )
}
