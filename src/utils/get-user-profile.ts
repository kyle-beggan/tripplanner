import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

export const getUserProfile = cache(async () => {
    const supabase = await createClient()

    let user = null;
    try {
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch (err) {
        console.error('getUserProfile Supabase getUser error:', err)
    }

    let profile = null

    if (user) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            profile = data
        } catch (err) {
            console.error('getUserProfile Supabase profile fetch error:', err)
        }
    }

    return { user, profile }
})
