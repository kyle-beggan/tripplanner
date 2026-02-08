import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

export const getUserProfile = cache(async () => {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let profile = null

    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = data
    }

    return { user, profile }
})
