'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(provider: 'google' | 'facebook') {
    const supabase = await createClient()
    const redirectUrl = getURL('/auth/callback')
    // console.log('--- DEBUG START ---')
    // console.log('Generated Redirect URL:', redirectUrl)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
        },
    })

    // if (data?.url) {
    //      console.log('Supabase OAuth URL:', data.url)
    //      console.log('--- DEBUG END ---')
    // }

    if (error) {
        console.error('Login error:', error)
        redirect('/login?message=Could not authenticate user')
    }

    if (data.url) {
        redirect(data.url)
    }
}

const getURL = (path: string = '') => {
    // Check if NEXT_PUBLIC_SITE_URL is set and non-empty.
    // This is a common convention for custom domains.
    let url =
        process.env.NEXT_PUBLIC_SITE_URL &&
            process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
            ? process.env.NEXT_PUBLIC_SITE_URL
            : // If not set, check for VERCEL_URL, which is automatically set by Vercel.
            process.env.NEXT_PUBLIC_VERCEL_URL &&
                process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
                ? process.env.NEXT_PUBLIC_VERCEL_URL
                : // If neither is set, default to localhost for local development.
                'http://localhost:3000'

    // Trim the URL and remove trailing slash if exists.
    url = url.replace(/\/+$/, '')
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Ensure path starts with a slash
    path = path.replace(/^\/+/, '')

    return path ? `${url}/${path}` : url
}
