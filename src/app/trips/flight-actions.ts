'use server'

import { createClient } from '@/utils/supabase/server'
// @ts-ignore - amadeus types are not perfect
import Amadeus from 'amadeus'

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
})

export async function getEstimateFlightPrice(tripId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Unauthorized' }
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
        .select('locations, end_date')
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

    let destinationCode = ''

    // Simple heuristic: if the name is 3 letters and uppercase, assume it's an IATA code
    if (firstLeg.name && firstLeg.name.length === 3 && firstLeg.name === firstLeg.name.toUpperCase()) {
        destinationCode = firstLeg.name
    } else {
        // Search for the city/airport code using Amadeus
        try {
            const response = await amadeus.referenceData.locations.get({
                keyword: firstLeg.name.split(',')[0], // heuristic: take first part of string
                subType: Amadeus.location.city
            })

            if (response.data && response.data.length > 0) {
                destinationCode = response.data[0].iataCode
            }
        } catch (error) {
            console.error('Error finding destination code:', error)
        }
    }

    if (!destinationCode) {
        // Fallback: try using the address or just fail gracefully
        return { success: false, message: 'Could not determine destination airport' }
    }

    if (!firstLeg.start_date) {
        return { success: false, message: 'Trip has no start date' }
    }

    // 3. Search Flight Offers
    try {
        const searchParams: any = {
            originLocationCode: profile.home_airport,
            destinationLocationCode: destinationCode,
            departureDate: firstLeg.start_date.split('T')[0], // Ensure YYYY-MM-DD
            currencyCode: 'USD',
            adults: '1',
            max: '1'
        }

        // Add return date if trip has an end date
        if (trip.end_date) {
            searchParams.returnDate = trip.end_date.split('T')[0]
        }

        const response = await amadeus.shopping.flightOffersSearch.get(searchParams)

        if (response.data && response.data.length > 0) {
            const offer = response.data[0]

            // Construct Google Flights Deep Link
            // Format: https://www.google.com/travel/flights?q=Flights%20to%20[DEST]%20from%20[ORIGIN]%20on%20[DATE]%20through%20[RETURNDATE]
            const departureDate = firstLeg.start_date.split('T')[0]
            let googleFlightsUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${destinationCode}%20from%20${profile.home_airport}%20on%20${departureDate}`

            if (trip.end_date) {
                const returnDate = trip.end_date.split('T')[0]
                googleFlightsUrl += `%20through%20${returnDate}`
            }

            return {
                success: true,
                currency: offer.price.currency,
                total: offer.price.total,
                airline: offer.validatingAirlineCodes[0],
                origin: profile.home_airport,
                destination: destinationCode,
                deepLink: googleFlightsUrl
            }
        } else {
            return { success: false, message: 'No flights found' }
        }

    } catch (error) {
        console.error('Amadeus API Error:', error)
        return { success: false, message: 'Failed to fetch flight estimate' }
    }
}
