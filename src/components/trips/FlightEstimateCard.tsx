'use client'

import { useState, useEffect } from 'react'
import { Plane, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { getEstimateFlightPrice } from '@/app/trips/flight-actions'

interface FlightEstimateCardProps {
    tripId: string
    initialEstimate?: any
}

export default function FlightEstimateCard({ tripId, initialEstimate }: FlightEstimateCardProps) {
    const [loading, setLoading] = useState(!initialEstimate)
    const [estimate, setEstimate] = useState<any>(initialEstimate || null)
    const [error, setError] = useState<string | null>(initialEstimate && !initialEstimate.success ? initialEstimate.message : null)

    useEffect(() => {
        if (initialEstimate) return

        getEstimateFlightPrice(tripId)
            .then(result => {
                if (result.success) {
                    setEstimate(result)
                } else {
                    setError(result.message || 'Unknown error')
                }
            })
            .catch(err => {
                console.error(err)
                setError('Failed to load estimate')
            })
            .finally(() => setLoading(false))
    }, [tripId])

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

    if (error) {
        return (
            <div className="bg-red-50 rounded-lg p-4 flex gap-2 text-red-700 text-sm items-center">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Flight Estimate Error: {error}</span>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Plane className="h-4 w-4 text-indigo-600" />
                    <h3>Flight Estimate</h3>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {estimate.origin} &rarr; {estimate.destination}
                </span>
            </div>

            <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                        {estimate.currency} {estimate.total}
                    </span>
                    <span className="text-sm text-gray-500">per person</span>
                </div>

                {estimate.deepLink && (
                    <a
                        href={estimate.deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        View Flights <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
                *Estimated lowest fare via Amadeus. Prices subject to change.
            </p>
        </div>
    )
}
