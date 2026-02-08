import { NextResponse } from 'next/server'

const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'

export async function POST(request: Request) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Server configuration error: Missing API Key' },
            { status: 500 }
        )
    }

    try {
        const body = await request.json()
        const { query, location } = body

        if (!query) {
            return NextResponse.json(
                { error: 'Missing query parameter' },
                { status: 400 }
            )
        }

        // Construct the text query
        // If a location is provided, append it to the query for better relevance
        // e.g., "Hiking near Austin, TX"
        const textQuery = location ? `${query} near ${location}` : query

        const response = await fetch(GOOGLE_PLACES_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                // Request specific fields to manage billing/latency
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.photos,places.priceLevel,places.websiteUri'
            },
            body: JSON.stringify({
                textQuery: textQuery,
                // Optional: Bias results to the provided location if we had lat/lng
                // For now, "near location" in textQuery is surprisingly effective
                maxResultCount: 10
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Google Places API Error:', errorData)
            return NextResponse.json(
                { error: 'Failed to fetch places', details: errorData },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('API Route Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
