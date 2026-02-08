'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    return profiles
}

export async function updateUserStatus(userId: string, status: 'approved' | 'rejected', role: 'user' | 'admin' = 'user') {
    const supabase = await createClient()

    // Verify requesting user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ status, role }) // Also update role if needed, but primarily status
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Verify requesting user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
}
