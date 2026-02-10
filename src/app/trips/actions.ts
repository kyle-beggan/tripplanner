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

export async function addToTripAgenda(tripId: string, place: any) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Check if user is owner or admin
    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, agenda')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
        throw new Error('Unauthorized: Only the host or an admin can modify the agenda')
    }

    const currentAgenda = trip?.agenda || []
    const placeName = place.displayName?.text || place.name

    // Check if already in agenda
    const exists = Array.isArray(currentAgenda) && currentAgenda.some((item: any) =>
        (item.id && item.id === place.id) || item.name === placeName
    )

    if (exists) {
        return { success: true, message: 'Already in agenda' }
    }

    const newAgendaItem = {
        id: place.id,
        name: placeName,
        formattedAddress: place.formattedAddress,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri,
        websiteUri: place.websiteUri,
        addedAt: new Date().toISOString()
    }

    const { error } = await supabase
        .from('trips')
        .update({
            agenda: [...(Array.isArray(currentAgenda) ? currentAgenda : []), newAgendaItem]
        })
        .eq('id', tripId)

    if (error) {
        console.error('Error adding to agenda:', error)
        throw new Error('Failed to update agenda')
    }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

// Lodging actions
export async function addLodgingToLeg(tripId: string, legIndex: number, lodgingData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!trip || (!isOwner && !isAdmin)) {
        return { success: false, message: 'Unauthorized' }
    }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg) return { success: false, message: 'Leg not found' }

    if (!leg.lodging) leg.lodging = []

    // Convert Place object to Lodging object
    const newLodging = {
        id: lodgingData.id,
        name: lodgingData.displayName?.text || lodgingData.name,
        address: lodgingData.formattedAddress,
        type: 'hotel', // Default for Google Places
        price_level: lodgingData.priceLevel ? lodgingData.priceLevel.length : undefined, // Google returns "PRICE_LEVEL_EXPENSIVE" or "EXPENSIVE" usually, need adaptation if it's enum
        rating: lodgingData.rating,
        user_rating_count: lodgingData.userRatingCount,
        google_maps_uri: lodgingData.googleMapsUri,
        website_uri: lodgingData.websiteUri,
        booked: false
    }

    leg.lodging.push(newLodging)

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function removeLodgingFromLeg(tripId: string, legIndex: number, lodgingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!trip || (!isOwner && !isAdmin)) {
        return { success: false, message: 'Unauthorized' }
    }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    leg.lodging = leg.lodging.filter((l: any) => l.id !== lodgingId)

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function toggleLodgingBookingStatus(tripId: string, legIndex: number, lodgingId: string, isBooked: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!trip || (!isOwner && !isAdmin)) {
        return { success: false, message: 'Unauthorized' }
    }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging.find((l: any) => l.id === lodgingId)
    if (lodging) lodging.booked = isBooked

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function addCustomLodgingToLeg(tripId: string, legIndex: number, lodgingData: {
    name: string
    address?: string
    total_cost?: number
    website_uri?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!trip || (!isOwner && !isAdmin)) {
        return { success: false, message: 'Unauthorized' }
    }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg) return { success: false, message: 'Leg not found' }

    if (!leg.lodging) leg.lodging = []

    const newLodging = {
        id: crypto.randomUUID(),
        name: lodgingData.name,
        address: lodgingData.address || '',
        type: 'custom',
        total_cost: lodgingData.total_cost,
        website_uri: lodgingData.website_uri,
        booked: false,
        rating: null,
        user_rating_count: null,
        google_maps_uri: null,
        price_level: null
    }

    leg.lodging.push(newLodging)

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function addActivityToLegSchedule(tripId: string, legIndex: number, date: string, time: string, description: string, placeDetails?: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!trip || (!isOwner && !isAdmin)) {
        return { success: false, message: 'Unauthorized' }
    }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg) return { success: false, message: 'Leg not found' }

    if (!leg.schedule) {
        // Initialize schedule if empty. 
        // We might want to pre-fill it based on start/end dates, but for now just create the array
        leg.schedule = []
    }

    // Find or create day entry
    let daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date)

    // If exact match not found, try to find by string comparison carefully? 
    // Assuming date passed in is YYYY-MM-DD
    if (!daySchedule) {
        daySchedule = {
            date: date,
            activities: []
        }
        leg.schedule.push(daySchedule)
        // Sort schedule by date
        leg.schedule.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    if (!daySchedule.activities) daySchedule.activities = []

    // Add activity
    daySchedule.activities.push({
        time: time,
        description: description
    })

    // Sort activities by time
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function sendTripInvitation(tripId: string, emails: string[], message: string) {
    // 1. Verify user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Unauthorized' }

    // 2. Verify permissions (Owner or Admin)
    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, name')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip.owner_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
        return { success: false, message: 'You do not have permission to invite people to this trip.' }
    }

    // 3. Send Emails via Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
        console.error('RESEND_API_KEY is not set')
        return { success: false, message: 'Server configuration error: Email service not configured.' }
    }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)

        // Send to each recipient
        // In production, you might want to batch this or use a queue
        const emailPromises = emails.map(email => {
            return resend.emails.send({
                from: 'LFG Places <onboarding@resend.dev>', // Update this with your verified domain
                to: email,
                subject: `Invitation to ${trip.name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">You're invited!</h2>
                        <p>${user.user_metadata?.full_name || 'A friend'} invited you to join <strong>${trip.name}</strong> on LFG Places.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin-top: 0; white-space: pre-wrap;">${message}</p>
                        </div>

                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/trips/${tripId}" 
                           style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                           View Trip & RSVP
                        </a>
                        
                        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                            Sent via LFG Places
                        </p>
                    </div>
                `
            })
        })

        await Promise.all(emailPromises)
        return { success: true }

    } catch (error) {
        console.error('Resend error:', error)
        return { success: false, message: 'Failed to send emails.' }
    }
}
