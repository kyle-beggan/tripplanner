'use client'

import { useState, useEffect } from 'react'
import { MapPin, Star, ExternalLink, Loader2, Navigation, X, Plus, Check, BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { addLodgingToLeg } from '@/app/trips/actions'

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

interface LodgingSearchModalProps {
    isOpen: boolean
    onClose: () => void
    locationName: string
    tripId: string
    legIndex: number
    onAdd?: () => void
}

export default function LodgingSearchModal({
    isOpen,
    onClose,
    locationName,
    tripId,
    legIndex,
    onAdd
}: LodgingSearchModalProps) {
    const [places, setPlaces] = useState<Place[]>([])
    const [loading, setLoading] = useState(false)
    const [addingId, setAddingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)

    const handleSearch = async (queryOverride?: string, pageToken?: string | null) => {
        const query = queryOverride || `hotels in ${locationName}`
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    location: locationName, // Implicitly guided by the location
                    pageToken: pageToken
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch places')
            }

            if (pageToken) {
                setPlaces(prev => [...prev, ...(data.places || [])])
            } else {
                setPlaces(data.places || [])
            }

            setNextPageToken(data.nextPageToken || null)

        } catch (err: any) {
            console.error('Search error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (place: Place) => {
        setAddingId(place.id)
        try {
            const result = await addLodgingToLeg(tripId, legIndex, place)
            if (result.success) {
                toast.success(`"${place.displayName.text}" added to lodging!`)
                onAdd?.()
                // Don't close immediately so they can add alternatives
            } else {
                toast.error(result.message || 'Failed to add lodging')
            }
        } catch (err) {
            toast.error('Failed to add lodging')
        } finally {
            setAddingId(null)
        }
    }

    // Auto-search logic
    useEffect(() => {
        if (isOpen && locationName) {
            setPlaces([])
            setNextPageToken(null)
            setSearchQuery(`hotels in ${locationName}`)
            handleSearch(`hotels in ${locationName}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, locationName])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BedDouble className="h-6 w-6 text-indigo-600" />
                            Find Lodging in {locationName}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Search for hotels, hostels, or other places to stay.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. Luxury hotels, budget hostels..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    />
                    <button
                        onClick={() => handleSearch(searchQuery)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                    >
                        Search
                    </button>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            <p className="animate-pulse">Checking availability...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <div className="text-5xl">⚠️</div>
                            <p className="text-red-500 font-medium">{error}</p>
                            <button
                                onClick={() => handleSearch(searchQuery)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : places.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                                <BedDouble className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No places found</p>
                            <p className="text-sm">
                                Try adjusting your search terms.
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
                                    <div className="flex sm:flex-col gap-2 justify-center sm:min-w-[140px]">
                                        <button
                                            onClick={() => handleAdd(place)}
                                            disabled={addingId === place.id}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md shadow-sm transition-colors whitespace-nowrap disabled:opacity-50"
                                        >
                                            {addingId === place.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Plus className="h-3 w-3" />
                                            )}
                                            <span>Add Option</span>
                                        </button>

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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="animate-pulse text-sm">Finding more spots...</p>
                        </div>
                    )}

                    {!loading && nextPageToken && (
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => handleSearch(searchQuery, nextPageToken)}
                                className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-full hover:bg-indigo-50 hover:shadow-sm transition-all flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Find More Results
                            </button>
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
