'use client'

import { useState, useEffect } from 'react'
import { Plane, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { getEstimateFlightPrice } from '@/app/trips/flight-actions'

interface FlightEstimateCardProps {
    tripId: string
    initialEstimate?: any
}

interface FlightEstimateResult {
    success: boolean
    message?: string
    code?: string
    currency?: string
    total?: string
    airline?: string
    origin?: string
    destination?: string
    deepLink?: string
    debugError?: any
}

export default function FlightEstimateCard({ tripId, initialEstimate }: FlightEstimateCardProps) {
    const [loading, setLoading] = useState(!initialEstimate)
    const [estimate, setEstimate] = useState<FlightEstimateResult | null>(initialEstimate || null)
    const [error, setError] = useState<string | null>(initialEstimate && !initialEstimate.success ? initialEstimate.message : null)

    useEffect(() => {
        if (initialEstimate) return

        getEstimateFlightPrice(tripId)
            .then((result: any) => {
                if (result.success) {
                    setEstimate(result)
                } else if (result.deepLink) {
                    // Fallback: API failed but we have a link
                    setEstimate({
                        ...result,
                        success: false
                    })
                    setError(null)
                } else {
                    setError(result.message || 'Unknown error')
                }
            })
            .catch(err => {
                console.error(err)
                setError('Failed to load estimate')
            })
            .finally(() => setLoading(false))
    }, [tripId, initialEstimate])

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
            </div>
        )
    }

    // If user has no home airport set, we should probably guide them to set it.
    // The server action returns "No home airport set" message in that case.
    if (error === 'No home airport set') {
        return (
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                    <Plane className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-blue-900">Estimate Flight Prices</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Add a <strong>Home Airport</strong> to your profile to see estimated flight costs for this trip.
                        </p>
                        <a href="/profile" className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800">
                            Update Profile &rarr;
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    // Handle missing destination airport error
    if (error === 'Could not determine destination airport' || (initialEstimate && initialEstimate.code === 'MISSING_DESTINATION')) {
        const handleManualDestinationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const code = formData.get('code') as string

            if (!code || code.length !== 3) {
                // Simple client-side validation
                return
            }

            setLoading(true)

            // Dynamically import the action
            const { updateTripDestination } = await import('@/app/trips/flight-actions')
            const result = await updateTripDestination(tripId, code)

            if (result.success) {
                // Retry estimate
                getEstimateFlightPrice(tripId)
                    .then(res => {
                        if (res.success) {
                            setEstimate(res)
                            setError(null)
                        } else {
                            setError(res.message || 'Unknown error')
                        }
                    })
                    .finally(() => setLoading(false))
            } else {
                setError('Failed to update destination code')
                setLoading(false)
            }
        }

        return (
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-amber-900">Destination Airport Needed</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            We couldn&apos;t automatically determine the airport for this trip&apos;s location. Please enter the 3-letter IATA code (e.g., LHR, JFK) to get flight estimates.
                        </p>
                        <form onSubmit={handleManualDestinationSubmit} className="mt-3 flex gap-2">
                            <input
                                type="text"
                                name="code"
                                placeholder="IATA Code"
                                maxLength={3}
                                className="w-24 rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm uppercase"
                                required
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                                Set & Retry
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 rounded-lg p-4 flex gap-2 text-red-700 text-sm items-center">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Flight Estimate Error: {error}</span>
            </div>
        )
    }

    if (!estimate) return null

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Plane className="h-4 w-4 text-indigo-600" />
                    <h3>Flight Estimate</h3>
                </div>
                {estimate.origin && estimate.destination && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {estimate.origin} &rarr; {estimate.destination}
                    </span>
                )}
            </div>

            <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                    {estimate.currency && estimate.total ? (
                        <span className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: estimate.currency }).format(Number(estimate.total))}
                        </span>
                    ) : (
                        <span className="text-lg font-semibold text-gray-400 italic">
                            Estimate Unavailable
                        </span>
                    )}
                    {estimate.currency && estimate.total && (
                        <span className="text-sm text-gray-500">per person</span>
                    )}
                </div>

                {estimate.deepLink && (
                    <a
                        href={estimate.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        {estimate.total ? 'View Flights' : 'Check Prices'} <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
                {estimate.total
                    ? '*Estimated lowest fare via Amadeus. Prices subject to change.'
                    : '*Unable to fetch live estimate. Please check Google Flights directly.'}
            </p>
        </div>
    )
}
