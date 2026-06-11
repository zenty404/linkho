import { signOut } from '@/lib/actions/auth'

export default function EnAttentePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div>
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-navy">LIN</span>
            <span className="text-brand">KHO</span>
          </span>
        </div>

        {/* Icône */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-navy">Compte en cours de validation</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Votre compte est en cours de validation par l&apos;équipe LINKHO.
            Vous recevrez un email dès que votre accès sera activé.
          </p>
        </div>

        {/* Déconnexion */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full py-2.5 px-5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
