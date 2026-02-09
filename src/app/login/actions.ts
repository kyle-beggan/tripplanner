'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function login(provider: 'google' | 'facebook') {
    const supabase = await createClient()
    const redirectUrl = await getURL('/auth/callback')
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

const getURL = async (path: string = '') => {
    // 1. Try environment variables first (most reliable if set)
    let url = process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_SITE_URL
        : process.env.NEXT_PUBLIC_VERCEL_URL && process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
            ? process.env.NEXT_PUBLIC_VERCEL_URL
            : null;

    // 2. Fallback to request headers (dynamic detection)
    if (!url) {
        try {
            const headerList = await headers();
            const host = headerList.get('x-forwarded-host') || headerList.get('host');
            const proto = headerList.get('x-forwarded-proto') || 'http';
            if (host) {
                url = `${proto}://${host}`;
            }
        } catch (e) {
            // headers() might throw if called outside request context (e.g. build time), ignore
        }
    }

    // 3. Last fallback: Localhost
    if (!url) {
        url = 'http://localhost:3000';
    }

    // Trim the URL and remove trailing slash if exists.
    url = url.replace(/\/+$/, '');
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;
    // Ensure path starts with a slash
    path = path.replace(/^\/+/, '');

    return path ? `${url}/${path}` : url;
}
