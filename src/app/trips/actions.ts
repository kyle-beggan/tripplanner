'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTrip(tripId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase.from('trips').delete().eq('id', tripId)

    if (error) {
        console.error('Error deleting trip:', error)
        throw new Error('Failed to delete trip')
    }

    revalidatePath('/trips')
}
