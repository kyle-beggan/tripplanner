'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { differenceInDays } from 'date-fns'
import { getEstimateFlightPrice } from './flight-actions'

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
export async function addLodgingToLeg(tripId: string, legIndex: number, lodgingData: any, estimatedCostPerPerson?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: participant } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .maybeSingle()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'
    const isParticipant = !!participant

    if (!trip || (!isOwner && !isAdmin && !isParticipant)) {
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
        booked: false,
        estimated_cost_per_person: estimatedCostPerPerson,
        host_id: user.id,
        host_name: user.user_metadata?.full_name || user.email,
        total_bedrooms: 1,
        available_bedrooms: 0,
        guest_ids: []
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

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging.find((l: any) => l.id === lodgingId)
    if (!lodging) return { success: false, message: 'Lodging not found' }

    const isHost = lodging.host_id === user.id

    if (!isOwner && !isAdmin && !isHost) {
        return { success: false, message: 'Unauthorized' }
    }

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

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging.find((l: any) => l.id === lodgingId)
    if (!lodging) return { success: false, message: 'Lodging not found' }

    const isHost = lodging.host_id === user.id

    if (!isOwner && !isAdmin && !isHost) {
        return { success: false, message: 'Unauthorized' }
    }

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
    estimated_cost_per_person?: number
    website_uri?: string
    total_bedrooms?: number
    available_bedrooms?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, locations')
        .eq('id', tripId)
        .single()

    const { data: participant } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .maybeSingle()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isOwner = trip?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'
    const isParticipant = !!participant

    if (!trip || (!isOwner && !isAdmin && !isParticipant)) {
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
        price_level: null,
        estimated_cost_per_person: lodgingData.estimated_cost_per_person,
        host_id: user.id,
        host_name: user.user_metadata?.full_name || user.email,
        total_bedrooms: 1,
        available_bedrooms: 0,
        guest_ids: []
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

export async function addActivityToLegSchedule(tripId: string, legIndex: number, date: string, time: string, description: string, placeDetails?: any, estimatedCost?: number, locationName?: string, venmoLink?: string) {
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
        description: description,
        estimated_cost: estimatedCost,
        location_name: locationName,
        venmo_link: venmoLink,
        participants: [] // Initialize with empty participants
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
        .select('owner_id, name, locations, estimated_participants')
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

    // --- Calculate Costs ---
    const estimatedParticipantsCount = trip.estimated_participants || 1
    const legs = Array.isArray(trip.locations) ? (trip.locations as any[]) : []

    // 1. Lodging Cost calculation
    const lodgingTotalPerPerson = legs.reduce((totalPerPerson, leg) => {
        const legLodging = leg.lodging || []
        let nights = 0
        if (leg.start_date && leg.end_date) {
            try {
                nights = differenceInDays(new Date(leg.end_date), new Date(leg.start_date))
            } catch (e) {
                console.error('Date error in lodging calc:', e)
            }
        }

        return totalPerPerson + legLodging.reduce((acc: number, l: any) => {
            if (l.type === 'hotel') {
                return acc + ((l.estimated_cost_per_person || 0) * (nights || 1))
            } else {
                return acc + ((l.total_cost || 0) / estimatedParticipantsCount)
            }
        }, 0)
    }, 0)

    // 2. Activities Cost calculation (Potential total)
    let activityTotalPotential = 0
    legs.forEach(leg => {
        const schedule = leg.schedule || []
        schedule.forEach((day: any) => {
            day.activities?.forEach((act: any) => {
                activityTotalPotential += (act.estimated_cost || 0)
            })
        })
    })

    // 3. Flight Cost (Estimate)
    const flightEstimateResult = await getEstimateFlightPrice(tripId)
    // @ts-ignore
    const flightCost = flightEstimateResult.success && flightEstimateResult.total ? Number(flightEstimateResult.total) : 0

    const blufTotal = flightCost + lodgingTotalPerPerson + activityTotalPotential
    // --- End Costs ---

    // 3. Send Emails via Resend
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
        console.error('RESEND_API_KEY is not set')
        return { success: false, message: 'Server configuration error: Email service not configured.' }
    }

    try {
        const { Resend } = await import('resend')
        const { headers } = await import('next/headers')
        const resend = new Resend(resendApiKey)

        // Dynamically determine the base URL - prioritize env var for production
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL
        if (!baseUrl) {
            const host = (await headers()).get('host')
            const protocol = host?.includes('localhost') ? 'http' : 'https'
            baseUrl = host ? `${protocol}://${host}` : 'https://lfgplaces.com'
        }

        // Send to each recipient
        const emailPromises = emails.map(email => {
            return resend.emails.send({
                from: 'LFG Places <invites@lfgplaces.com>',
                to: email,
                subject: `Invitation to ${trip.name}`,
                html: `
                    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #1f2937;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #4f46e5; font-size: 28px; font-weight: 800; margin: 0;">LFG Places</h1>
                            <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Find your next adventure together.</p>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; border-radius: 16px; color: #ffffff; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.2);">
                            <h2 style="margin: 0; font-size: 22px; font-weight: 700;">You're invited!</h2>
                            <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.96;">
                                ${user.user_metadata?.full_name || 'A friend'} invited you to join <strong>${trip.name}</strong>.
                            </p>
                        </div>

                        <!-- BLUF Section -->
                        <div style="background-color: #f0f7ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                            <div style="text-align: center; border-bottom: 1px solid #bae6fd; padding-bottom: 16px; margin-bottom: 16px;">
                                <div style="text-transform: uppercase; font-size: 12px; font-weight: 800; color: #0369a1; letter-spacing: 0.1em; margin-bottom: 4px;">Estimated Cost Per Person</div>
                                <div style="font-size: 36px; font-weight: 800; color: #0c4a6e;">$${blufTotal.toLocaleString()}</div>
                            </div>
                            <div style="display: flex; justify-content: space-around; font-size: 14px; text-align: center;">
                                <div>
                                    <div style="color: #64748b; margin-bottom: 4px;">Flights</div>
                                    <div style="font-weight: 700; color: #1e293b;">$${flightCost.toLocaleString()}</div>
                                </div>
                                <div style="border-left: 1px solid #bae6fd; height: 32px; margin: 0 10px;"></div>
                                <div>
                                    <div style="color: #64748b; margin-bottom: 4px;">Lodging</div>
                                    <div style="font-weight: 700; color: #1e293b;">$${lodgingTotalPerPerson.toLocaleString()}</div>
                                </div>
                                <div style="border-left: 1px solid #bae6fd; height: 32px; margin: 0 10px;"></div>
                                <div>
                                    <div style="color: #64748b; margin-bottom: 4px;">Activities</div>
                                    <div style="font-weight: 700; color: #1e293b;">$${activityTotalPotential.toLocaleString()}</div>
                                </div>
                            </div>
                            <div style="margin-top: 16px; font-size: 11px; color: #64748b; font-style: italic; text-align: center;">
                                Estimates are per person and subject to change. Lodging costs assume a full group of 20 participants. You have the ability to opt-in or out of activities on the itinerary to customize your overall price.
                            </div>
                        </div>

                        <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
                        </div>

                        <div style="margin-bottom: 32px;">
                            ${formatItineraryHTML(trip.locations)}
                        </div>

                        <div style="text-align: center;">
                            <a href="${baseUrl}/trips/${tripId}" 
                               style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; transition: all 0.2s ease-in-out; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06);">
                               View Trip & RSVP
                            </a>
                        </div>
                        
                        <div style="text-align: center; margin-top: 48px; border-top: 1px solid #f3f4f6; padding-top: 24px;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                Sent with ❤️ from LFG Places
                            </p>
                            <p style="color: #d1d5db; font-size: 11px; margin-top: 8px;">
                                if you didn't expect this, you can safely ignore this email.
                            </p>
                        </div>
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

// Helper to format itinerary
const formatItineraryHTML = (locations: any) => {
    if (!Array.isArray(locations) || locations.length === 0) return ''

    let html = '<div style="margin: 24px 0; border: 1px solid #f3f4f6; border-radius: 12px; overflow: hidden; background-color: #ffffff;">'
    html += '<div style="background-color: #f9fafb; padding: 14px 20px; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Trip Itinerary</div>'

    locations.forEach((leg: any, index: number) => {
        const hasActivities = leg.schedule && Array.isArray(leg.schedule) && leg.schedule.length > 0
        const hasLodging = leg.lodging && Array.isArray(leg.lodging) && leg.lodging.length > 0

        html += `<div style="padding: 24px; border-bottom: ${index === locations.length - 1 ? 'none' : '1px solid #f3f4f6'};">`
        html += `<h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 18px; font-weight: 700;">${leg.name || `Leg ${index + 1}`}</h3>`

        if (leg.start_date && leg.end_date) {
            const start = new Date(leg.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const end = new Date(leg.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            html += `<p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 13px; font-weight: 500;">${start} — ${end}</p>`
        }

        // Add Lodging section if exists
        if (hasLodging) {
            html += '<div style="margin-bottom: 20px;">'
            html += '<div style="font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Lodging</div>'
            leg.lodging.forEach((hotel: any) => {
                html += `<div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">`
                html += `<div style="font-weight: 600; color: #1e293b; font-size: 14px;">${hotel.name}</div>`
                if (hotel.estimated_cost_per_person) {
                    html += `<div style="color: #059669; font-weight: 700; font-size: 13px; margin-top: 4px;">Est. $${hotel.estimated_cost_per_person.toLocaleString()} per person</div>`
                }
                html += `</div>`
            })
            html += '</div>'
        }

        if (hasActivities) {
            html += '<div style="font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 12px;">Activities</div>'
            html += '<div style="space-y: 12px;">'
            leg.schedule.forEach((day: any) => {
                const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                html += `<div style="margin-bottom: 16px;">`
                html += `<div style="font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 8px; display: flex; align-items: center;">`
                html += `<span style="width: 8px; height: 8px; background-color: #6366f1; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>${date}`
                html += `</div>`

                if (day.activities && day.activities.length > 0) {
                    html += '<div style="padding-left: 16px; border-left: 2px solid #f3f4f6; margin-left: 3px;">'
                    day.activities.forEach((activity: any) => {
                        html += `<div style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">`
                        html += `<span style="color: #6366f1; font-weight: 600; margin-right: 8px;">${activity.time}</span>`
                        html += `<span>${activity.description}</span>`
                        if (activity.estimated_cost) {
                            html += `<span style="color: #059669; font-weight: 600; margin-left: 8px;">($${activity.estimated_cost.toLocaleString()})</span>`
                        }
                        html += `</div>`
                    })
                    html += '</div>'
                } else {
                    html += '<p style="margin: 4px 0 0 16px; font-size: 13px; color: #9ca3af; font-style: italic;">No activities scheduled</p>'
                }
                html += '</div>'
            })
            html += '</div>'
        } else if (!hasLodging) {
            html += '<p style="margin: 0; color: #9ca3af; font-style: italic; font-size: 14px; text-align: center; padding: 20px 0;">No itinerary details yet.</p>'
        }
        html += '</div>'
    })

    html += '</div>'
    return html
}

export async function getTripItineraryPreview(tripId: string) {
    const supabase = await createClient()

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return ''

    return formatItineraryHTML(trip.locations)
}

export async function updateLodgingInLeg(tripId: string, legIndex: number, lodgingId: string, updates: {
    name?: string
    address?: string
    total_cost?: number
    estimated_cost_per_person?: number
    website_uri?: string
    total_bedrooms?: number
    available_bedrooms?: number
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

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodgingIndex = leg.lodging.findIndex((l: any) => l.id === lodgingId)
    if (lodgingIndex === -1) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging[lodgingIndex]
    const isHost = lodging.host_id === user.id

    if (!isOwner && !isAdmin && !isHost) {
        return { success: false, message: 'Unauthorized' }
    }

    // Merge updates
    const currentLodging = leg.lodging[lodgingIndex]
    leg.lodging[lodgingIndex] = {
        ...currentLodging,
        ...updates
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function toggleActivityParticipation(tripId: string, legIndex: number, date: string, activityIndex: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]

    if (!leg || !leg.schedule) return { success: false, message: 'Schedule not found' }

    const daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date.split('T')[0])
    if (!daySchedule || !daySchedule.activities) return { success: false, message: 'Activity not found' }

    // Re-sort to match UI index if needed, OR verify index. 
    // WARN: Index might be fragile if array isn't sorted same way. 
    // Ideally we'd validte by content, but for now we trust the sorted order if consistent.
    // Let's rely on finding by index after ensuring sort.
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    const activity = daySchedule.activities[activityIndex]

    if (!activity) return { success: false, message: 'Activity not found' }

    if (!activity.participants) activity.participants = []

    const userIndex = activity.participants.indexOf(user.id)

    if (userIndex === -1) {
        activity.participants.push(user.id) // Join
    } else {
        activity.participants.splice(userIndex, 1) // Leave
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function joinAllTripActivities(tripId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    let modified = false

    locations.forEach((leg: any) => {
        if (leg.schedule && Array.isArray(leg.schedule)) {
            leg.schedule.forEach((day: any) => {
                if (day.activities && Array.isArray(day.activities)) {
                    day.activities.forEach((activity: any) => {
                        if (!activity.participants) activity.participants = []
                        if (!activity.participants.includes(user.id)) {
                            activity.participants.push(user.id)
                            modified = true
                        }
                    })
                }
            })
        }
    })

    if (!modified) {
        return { success: true, message: 'Already joined all activities' }
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function unjoinAllTripActivities(tripId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    let modified = false

    locations.forEach((leg: any) => {
        if (leg.schedule && Array.isArray(leg.schedule)) {
            leg.schedule.forEach((day: any) => {
                if (day.activities && Array.isArray(day.activities)) {
                    day.activities.forEach((activity: any) => {
                        if (activity.participants && Array.isArray(activity.participants)) {
                            const initialLength = activity.participants.length
                            activity.participants = activity.participants.filter((id: string) => id !== user.id)
                            if (activity.participants.length !== initialLength) {
                                modified = true
                            }
                        }
                    })
                }
            })
        }
    })

    if (!modified) {
        return { success: true, message: 'Already unjoined all activities' }
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function updateParticipantIsFlying(tripId: string, isFlying: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Unauthorized' }
    }

    // Verify user is a participant or owner
    const { error } = await supabase
        .from('trip_participants')
        .update({ is_flying: isFlying })
        .eq('trip_id', tripId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating flight status:', error)
        return { success: false, message: 'Failed to update status' }
    }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function removeActivityFromLegSchedule(tripId: string, legIndex: number, date: string, activityIndex: number) {
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

    if (!leg || !leg.schedule) return { success: false, message: 'Schedule not found' }

    const daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date.split('T')[0])
    if (!daySchedule || !daySchedule.activities) return { success: false, message: 'Activity not found' }

    // Sort to ensure index matches UI if needed, though toggleActivityParticipation does this
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    if (activityIndex < 0 || activityIndex >= daySchedule.activities.length) {
        return { success: false, message: 'Invalid activity index' }
    }

    // Remove the activity
    daySchedule.activities.splice(activityIndex, 1)

    // Optional: If day is now empty, we could remove the day entry entirely
    // if (daySchedule.activities.length === 0) {
    //     leg.schedule = leg.schedule.filter((d: any) => d.date.split('T')[0] !== date.split('T')[0])
    // }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function updateActivityInLegSchedule(
    tripId: string,
    legIndex: number,
    date: string,
    activityIndex: number,
    updatedData: {
        time: string,
        description: string,
        estimatedCost?: number,
        locationName?: string,
        venmoLink?: string
    }
) {
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

    if (!leg || !leg.schedule) return { success: false, message: 'Schedule not found' }

    const daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date.split('T')[0])
    if (!daySchedule || !daySchedule.activities) return { success: false, message: 'Activity not found' }

    // Ensure activities are sorted to match index logic
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    if (activityIndex < 0 || activityIndex >= daySchedule.activities.length) {
        return { success: false, message: 'Invalid activity index' }
    }

    // Update the activity
    const activity = daySchedule.activities[activityIndex]
    activity.time = updatedData.time
    activity.description = updatedData.description
    activity.estimated_cost = updatedData.estimatedCost
    activity.location_name = updatedData.locationName
    activity.venmo_link = updatedData.venmoLink

    // Re-sort activities if time changed
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

export async function addActivityPhoto(
    tripId: string,
    legIndex: number,
    date: string,
    activityIndex: number,
    photoUrl: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]
    if (!leg || !leg.schedule) return { success: false, message: 'Schedule not found' }

    const daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date)
    if (!daySchedule || !daySchedule.activities) return { success: false, message: 'Activity not found' }

    // Sort to match index
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    const activity = daySchedule.activities[activityIndex]
    if (!activity) return { success: false, message: 'Activity not found' }

    if (!activity.photos) activity.photos = []
    activity.photos.push(photoUrl)

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function removeActivityPhoto(
    tripId: string,
    legIndex: number,
    date: string,
    activityIndex: number,
    photoUrl: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]
    if (!leg || !leg.schedule) return { success: false, message: 'Schedule not found' }

    const daySchedule = leg.schedule.find((d: any) => d.date.split('T')[0] === date)
    if (!daySchedule || !daySchedule.activities) return { success: false, message: 'Activity not found' }

    // Sort to match index
    daySchedule.activities.sort((a: any, b: any) => {
        const timeA = a.time.replace(':', '')
        const timeB = b.time.replace(':', '')
        return parseInt(timeA) - parseInt(timeB)
    })

    const activity = daySchedule.activities[activityIndex]
    if (!activity) return { success: false, message: 'Activity not found' }

    if (activity.photos) {
        activity.photos = activity.photos.filter((p: string) => p !== photoUrl)
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function updateTripDescription(tripId: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('owner_id')
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

    const { error } = await supabase
        .from('trips')
        .update({ description })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function createNewActivityCategory(name: string, requiresGps: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: 'Unauthorized' }

    // Check if category already exists
    const { data: existing } = await supabase
        .from('activities')
        .select('name')
        .ilike('name', name)
        .maybeSingle()

    if (existing) {
        return { success: false, message: 'A category with this name already exists.' }
    }

    const { error } = await supabase
        .from('activities')
        .insert({
            name,
            requires_gps: requiresGps
        })

    if (error) {
        console.error('Error creating activity category:', error)
        return { success: false, message: 'Failed to create category' }
    }

    revalidatePath('/trips') // Revalidate pages that use activities
    return { success: true }
}

export async function joinLodging(tripId: string, legIndex: number, lodgingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]
    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging.find((l: any) => l.id === lodgingId)
    if (!lodging) return { success: false, message: 'Lodging not found' }

    if (!lodging.guest_ids) lodging.guest_ids = []
    if (lodging.guest_ids.includes(user.id)) return { success: true, message: 'Already joined' }

    lodging.guest_ids.push(user.id)
    if (lodging.available_bedrooms > 0) {
        lodging.available_bedrooms -= 1
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}

export async function leaveLodging(tripId: string, legIndex: number, lodgingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: trip } = await supabase
        .from('trips')
        .select('locations')
        .eq('id', tripId)
        .single()

    if (!trip) return { success: false, message: 'Trip not found' }

    const locations = Array.isArray(trip.locations) ? [...trip.locations] : []
    const leg = locations[legIndex]
    if (!leg || !leg.lodging) return { success: false, message: 'Lodging not found' }

    const lodging = leg.lodging.find((l: any) => l.id === lodgingId)
    if (!lodging) return { success: false, message: 'Lodging not found' }

    if (!lodging.guest_ids) lodging.guest_ids = []
    const index = lodging.guest_ids.indexOf(user.id)
    if (index === -1) return { success: true, message: 'Not a guest' }

    lodging.guest_ids.splice(index, 1)
    if (lodging.available_bedrooms < lodging.total_bedrooms) {
        lodging.available_bedrooms += 1
    }

    const { error } = await supabase
        .from('trips')
        .update({ locations })
        .eq('id', tripId)

    if (error) return { success: false, message: error.message }

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}
