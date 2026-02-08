'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Activity {
    id: string
    name: string
    category: string | null
    requires_gps: boolean
    created_at: string
}

export async function getActivities() {
    const supabase = await createClient()

    const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching activities:', error)
        return []
    }

    return activities
}

export async function createActivity(name: string, category: string = 'General', requiresGps: boolean = false) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if admin (optional strict check, RLS handles it too but good for UI feedback)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('activities')
        .insert({ name, category, requires_gps: requiresGps })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/activities')
    return { success: true }
}

export async function deleteActivity(id: string) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/activities')
    return { success: true }
}

export async function updateActivity(id: string, name: string, requiresGps: boolean) {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('activities')
        .update({ name, requires_gps: requiresGps })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/activities')
    return { success: true }
}
