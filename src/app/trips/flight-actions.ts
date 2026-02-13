'use server'

import { createClient } from '@/utils/supabase/server'
// @ts-ignore - amadeus types are not perfect
import Amadeus from 'amadeus'

export type FlightEstimateResponse =
    | { success: true; currency: string; total: string; airline: string; origin: string; destination: string; deepLink: string }
    | { success: false; message: string; code?: string; debugError?: any; origin?: string; destination?: string; deepLink?: string }

export async function getEstimateFlightPrice(tripId: string): Promise<FlightEstimateResponse> {
    console.log('[getEstimateFlightPrice] Starting for trip:', tripId)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Unauthorized' }
    }

    // Lazy load specific for this request to avoid build-time errors if env vars are missing
    let amadeus;
    try {
        amadeus = new Amadeus({
            clientId: process.env.AMADEUS_CLIENT_ID,
            clientSecret: process.env.AMADEUS_CLIENT_SECRET
        })
    } catch (error) {
        console.error('Amadeus SDK Initialization Error:', error)
        return { success: false, message: 'Flight service unavailable' }
    }

    // 1. Get User Profile for Home Airport
    const { data: profile } = await supabase
        .from('profiles')
        .select('home_airport')
        .eq('id', user.id)
        .single()

    if (!profile?.home_airport) {
        return { success: false, message: 'No home airport set' }
    }

    // 2. Get Trip Details
    const { data: trip } = await supabase
        .from('trips')
        .select('locations, end_date, destination_airport_code')
        .eq('id', tripId)
        .single()

    if (!trip || !trip.locations || trip.locations.length === 0) {
        return { success: false, message: 'Trip has no locations' }
    }

    const firstLeg = trip.locations[0]

    // We need a destination airport code. 
    // If the location name looks like an airport code (3 chars, uppercase), use it.
    // Otherwise, we might need to search for it.
    // For MVP, let's assume if it's not 3 chars, we try to find a city/airport match.

    let destinationCode = trip.destination_airport_code || ''

    let locationSearchError = null

    if (!destinationCode) {
        // Simple heuristic: if the name is 3 letters and uppercase, assume it's an IATA code
        if (firstLeg.name && firstLeg.name.length === 3 && firstLeg.name === firstLeg.name.toUpperCase()) {
            destinationCode = firstLeg.name
        } else {
            // Search for the city/airport code using Amadeus
            try {
                if (!amadeus) {
                    amadeus = new Amadeus({
                        clientId: process.env.AMADEUS_CLIENT_ID,
                        clientSecret: process.env.AMADEUS_CLIENT_SECRET
                    })
                }

                const response = await amadeus.referenceData.locations.get({
                    keyword: firstLeg.name.split(',')[0],
                    subType: Amadeus.location.city
                })

                if (response.data && response.data.length > 0) {
                    destinationCode = response.data[0].iataCode
                }
            } catch (error: any) {
                console.error('Error finding destination code:', error)

                // Capture error for debug return
                locationSearchError = {
                    message: error.message,
                    name: error.name,
                    code: error.code,
                    stack: error.stack,
                    response: error.response ? {
                        status: error.response.statusCode,
                        body: error.response.body
                    } : 'No response'
                }
            }
        }
    }

    if (!destinationCode) {
        // Return specific error code to trigger UI input
        return {
            success: false,
            message: 'Could not determine destination airport',
            code: 'MISSING_DESTINATION',
            debugError: locationSearchError // Return captured error
        }
    }

    if (!firstLeg.start_date) {
        return { success: false, message: 'Trip has no start date' }
    }

    // Construct Google Flights Deep Link immediately (Availability doesn't depend on API success)
    const departureDate = firstLeg.start_date.split('T')[0]
    let googleFlightsUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destinationCode}%20from%20${profile.home_airport}%20on%20${departureDate}`

    if (trip.end_date) {
        const returnDate = trip.end_date.split('T')[0]
        googleFlightsUrl += `%20through%20${returnDate}`
    }

    const fallbackResult = {
        origin: profile.home_airport,
        destination: destinationCode,
        deepLink: googleFlightsUrl
    }

    // 3. Search Flight Offers
    try {
        const searchParams: Record<string, any> = {
            originLocationCode: profile.home_airport,
            destinationLocationCode: destinationCode,
            departureDate: firstLeg.start_date.split('T')[0], // Ensure YYYY-MM-DD
            currencyCode: 'USD',
            adults: 1, // Changed to number
            max: 5 // Increased to 5, sometimes 1 is too restrictive for algorithms
        }

        // Add return date if trip has an end date
        if (trip.end_date) {
            searchParams.returnDate = trip.end_date.split('T')[0]
        }

        const response = await amadeus.shopping.flightOffersSearch.get(searchParams)

        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            const offer = response.data[0]

            return {
                success: true,
                currency: offer.price.currency,
                total: offer.price.total,
                airline: offer.validatingAirlineCodes[0],
                ...fallbackResult
            }
        } else {
            console.log('Amadeus: No flights found for parameters:', searchParams)
            return {
                success: false,
                message: 'No flights found',
                ...fallbackResult
            }
        }

    } catch (error: any) {
        console.error('Amadeus API Error:', error?.message || error)

        // Return debug info to client since user can't see server logs
        return {
            success: false,
            message: 'Could not fetch estimate', // Generic message
            // Return the deep link so UI can still be helpful!
            ...fallbackResult
        }
    }
}

export async function updateTripDestination(tripId: string, destinationCode: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Unauthorized' }
    }

    // Check permissions
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
        .update({ destination_airport_code: destinationCode.toUpperCase() })
        .eq('id', tripId)

    if (error) {
        console.error('Error updating destination code:', error)
        return { success: false, message: 'Failed to update destination' }
    }

    // Revalidate paths that might display this
    return { success: true }
}
