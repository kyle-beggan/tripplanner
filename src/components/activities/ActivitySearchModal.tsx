'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Star, ExternalLink, Loader2, Navigation, X } from 'lucide-react'

interface Place {
    id: string
    displayName: { text: string }
    formattedAddress: string
    rating?: number
    userRatingCount?: number
    googleMapsUri?: string
    websiteUri?: string
    priceLevel?: string
}

interface ActivitySearchModalProps {
    isOpen: boolean
    onClose: () => void
    activityName: string
    locations: string[]
}

export default function ActivitySearchModal({
    isOpen,
    onClose,
    activityName,
    locations
}: ActivitySearchModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<string>(locations[0] || '')
    const [places, setPlaces] = useState<Place[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = useCallback(async (location: string) => {
        if (!location) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ textQuery: activityName }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch places')
            }

            setPlaces(data.places || [])
        } catch (err: any) {
            console.error('Search error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [activityName])

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLocation(locations[0] || '')
            setPlaces([])
            setError(null)
            // Optional: Auto-search on open
            if (locations.length > 0) {
                handleSearch(locations[0])
            }
        }
    }, [isOpen, locations, handleSearch])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-indigo-600" />
                            Find {activityName}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Searching for top-rated spots near your trip location.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search Controls */}
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <label htmlFor="location-select" className="text-sm font-medium text-gray-700">
                            Location:
                        </label>
                        <div className="flex-1">
                            <select
                                id="location-select"
                                value={selectedLocation}
                                onChange={(e) => {
                                    setSelectedLocation(e.target.value)
                                    handleSearch(e.target.value)
                                }}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={loading || locations.length <= 1}
                            >
                                {locations.length > 0 ? (
                                    locations.map((loc, idx) => (
                                        <option key={idx} value={loc}>{loc}</option>
                                    ))
                                ) : (
                                    <option value="">No location set for this trip</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            <p className="animate-pulse">Scouting the best spots...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <div className="text-5xl">⚠️</div>
                            <p className="text-red-500 font-medium">{error}</p>
                            <button
                                onClick={() => handleSearch(selectedLocation)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : places.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                                <MapPin className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No results found</p>
                            <p className="text-sm">
                                We couldn&apos;t find &quot;{activityName}&quot; near {selectedLocation}.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {places.map((place) => (
                                <div
                                    key={place.id}
                                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-gray-900">
                                                {place.displayName.text}
                                            </h3>
                                            {place.rating && (
                                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded text-xs font-medium text-yellow-700">
                                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                                    {place.rating} ({place.userRatingCount || 0})
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 flex items-start gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                                            {place.formattedAddress}
                                        </p>
                                    </div>
                                    <div className="flex sm:flex-col gap-2 justify-center sm:min-w-[120px]">
                                        {place.googleMapsUri && (
                                            <a
                                                href={place.googleMapsUri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors whitespace-nowrap"
                                            >
                                                <span>View on Maps</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                        {place.websiteUri && (
                                            <a
                                                href={place.websiteUri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-md shadow-sm transition-colors whitespace-nowrap"
                                            >
                                                <span>Website</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 bg-gray-50 rounded-b-xl">
                    <span>Results provided by Google Places</span>
                    <img src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" alt="Powered by Google" className="h-4 opacity-70" />
                </div>
            </div>
        </div>
    )
}
