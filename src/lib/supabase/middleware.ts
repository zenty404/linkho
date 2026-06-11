import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/supabase'

type UserRole = 'bde' | 'etablissement' | 'admin'

function getDashboardUrl(role: UserRole): string {
  if (role === 'bde') return '/bde/dashboard'
  if (role === 'etablissement') return '/etablissement/dashboard'
  return '/admin/dashboard'
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    // Utilisateur non connecté sur une route protégée → /login
    const protectedRoutes = ['/bde', '/etablissement', '/admin', '/onboarding']
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtected && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Utilisateur connecté sur une page auth → son dashboard
    const authRoutes = ['/login', '/register']
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    if (isAuthRoute && user) {
        const role = user.user_metadata?.role as UserRole | undefined
        if (role && ['bde', 'etablissement', 'admin'].includes(role)) {
            return NextResponse.redirect(new URL(getDashboardUrl(role), request.url))
        }
    }

    // Routes accessibles sans validation de compte
    const openRoutes = ['/en-attente', '/login', '/register', '/onboarding']
    const isOpenRoute = openRoutes.some(route => pathname.startsWith(route))

    // Profil BDE manquant ou non validé
    if (user && pathname.startsWith('/bde/')) {
        const { data: profil } = await supabase
            .from('bde_profiles')
            .select('id, compte_valide')
            .eq('user_id', user.id)
            .maybeSingle()
        if (!profil) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
        if (!profil.compte_valide) {
            return NextResponse.redirect(new URL('/en-attente', request.url))
        }
    }

    // Profil établissement manquant ou non validé
    if (user && pathname.startsWith('/etablissement/')) {
        const { data: profil } = await supabase
            .from('etablissement_profiles')
            .select('id, compte_valide')
            .eq('user_id', user.id)
            .maybeSingle()
        if (!profil) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
        if (!profil.compte_valide) {
            return NextResponse.redirect(new URL('/en-attente', request.url))
        }
    }

    // BDE/étab non validé sur une route protégée autre que bde/ ou etablissement/
    if (user && !isOpenRoute && !pathname.startsWith('/admin')) {
        const role = user.user_metadata?.role as UserRole | undefined
        if (role === 'bde' || role === 'etablissement') {
            const table = role === 'bde' ? 'bde_profiles' : 'etablissement_profiles'
            const { data: profil } = await supabase
                .from(table)
                .select('compte_valide')
                .eq('user_id', user.id)
                .maybeSingle()
            if (profil && !profil.compte_valide) {
                return NextResponse.redirect(new URL('/en-attente', request.url))
            }
        }
    }

    return supabaseResponse
}