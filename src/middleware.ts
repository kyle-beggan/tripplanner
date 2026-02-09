import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set({ name, value, ...options })
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const path = url.pathname

    // Public paths that don't need auth
    const isPublicPath = path === '/login' || path.startsWith('/auth') || path === '/pending'

    // If no user and trying to access protected route, redirect to login
    if (!user && !isPublicPath) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in
    if (user) {
        // 1. Check Profile Status
        // We need to fetch the profile to check status. 
        // Note: In middleware, performant DB calls are important. 
        // Ideally, basic auth user metadata could likely store status to avoid DB hit, 
        // but for now we query DB or rely on default behavior.

        // We can't easily query DB in middleware without potentially blocking.
        // However, Supabase Auth `getUser` is cached/optimized. 
        // Custom claims could optimize this, but let's query profile for safety.

        // *Optimization*: We can skip this if we are already on /pending or /login
        if (path !== '/pending' && !path.startsWith('/auth')) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('status, role')
                .eq('id', user.id)
                .single()

            // If profile doesn't exist yet (race condition on creation), let them proceed (or wait)
            // Usually handle_new_user trigger makes it instantly.

            if (profile) {
                if (profile.status === 'pending') {
                    url.pathname = '/pending'
                    return NextResponse.redirect(url)
                }
                if (profile.status === 'rejected') {
                    // Sign them out or show rejected page? 
                    // For now, pending page can handle rejection message too or dedicated error
                    url.pathname = '/pending'
                    return NextResponse.redirect(url)
                }
            }
        }

        // 2. If user is on /login but authenticated, redirect to trips
        if (path === '/login') {
            url.pathname = '/trips'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|version.txt|api/version|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
