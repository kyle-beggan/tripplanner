import { useState, useEffect, useCallback } from 'react'
import { MapPin, Star, ExternalLink, Loader2, Navigation, X, Plus, Check, Calendar, Clock } from 'lucide-react'
import { addToTripAgenda, addActivityToLegSchedule } from '@/app/trips/actions'
import { toast } from 'sonner'
import { format, eachDayOfInterval, addDays } from 'date-fns'

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
    tripId?: string
    isEditable?: boolean
    legIndex?: number
    startDate?: string | null
    endDate?: string | null
    enableScheduling?: boolean
    onSchedule?: () => void
    initialStartDate?: string | null
    initialEndDate?: string | null
}

export default function ActivitySearchModal({
    isOpen,
    onClose,
    activityName,
    locations,
    tripId,
    isEditable,
    legIndex,
    startDate,
    endDate,
    enableScheduling = false,
    onSchedule,
    initialStartDate,
    initialEndDate
}: ActivitySearchModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<string>(locations[0] || '')
    const [places, setPlaces] = useState<Place[]>([])
    const [loading, setLoading] = useState(false)
    const [addingToAgenda, setAddingToAgenda] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [nextPageToken, setNextPageToken] = useState<string | null>(null)

    // Schedule Modal State
    const [schedulePlace, setSchedulePlace] = useState<Place | null>(null)
    const [scheduleDate, setScheduleDate] = useState<string>('')
    const [scheduleTime, setScheduleTime] = useState<string>('12:00')
    const [scheduleCost, setScheduleCost] = useState<string>('')
    const [isScheduling, setIsScheduling] = useState(false)

    const handleSearch = useCallback(async (location: string, pageToken?: string | null) => {
        if (!location || !activityName) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: activityName,
                    location: location,
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
            console.error('Search error in component:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [activityName])

    const handleAddToAgenda = async (place: Place) => {
        if (!tripId) return

        // If we have leg context, open schedule modal instead
        if (typeof legIndex === 'number') {
            setSchedulePlace(place)
            if (startDate) {
                setScheduleDate(startDate.split('T')[0])
            }
            return
        }

        const placeName = place.displayName.text
        setAddingToAgenda(placeName)
        try {
            const result = await addToTripAgenda(tripId, place)
            if (result.success) {
                toast.success(`"${placeName}" added to trip agenda!`)
            } else {
                toast.error(result.message || 'Failed to add to agenda')
            }
        } catch (err) {
            toast.error('Failed to add to agenda')
        } finally {
            setAddingToAgenda(null)
        }
    }

    const confirmSchedule = async () => {
        if (!tripId || typeof legIndex !== 'number' || !schedulePlace || !scheduleDate) return

        setIsScheduling(true)
        try {
            const result = await addActivityToLegSchedule(
                tripId,
                legIndex,
                scheduleDate,
                scheduleTime,
                schedulePlace.displayName.text,
                schedulePlace,
                scheduleCost ? Number(scheduleCost) : undefined,
                schedulePlace.formattedAddress
            )

            if (result.success) {
                toast.success('Activity scheduled!')
                setSchedulePlace(null) // Close schedule modal
                onSchedule?.()
            } else {
                toast.error(result.message || 'Failed to schedule')
            }
        } catch (err) {
            toast.error('Failed to schedule activity')
        } finally {
            setIsScheduling(false)
        }
    }

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLocation(locations[0] || '')
            setPlaces([])
            setError(null)
            setNextPageToken(null)
            setNextPageToken(null)
            setSchedulePlace(null)
            setScheduleCost('')
            // Optional: Auto-search on open
            if (locations.length > 0) {
                handleSearch(locations[0])
            }
        }
    }, [isOpen, locations, handleSearch])

    // Generate date options
    const dateOptions = []
    if (startDate && endDate) {
        try {
            const start = new Date(startDate)
            const end = new Date(endDate)
            const days = eachDayOfInterval({ start, end })
            dateOptions.push(...days)
        } catch (e) {
            // Fallback if dates invalid
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* Schedule Overlay Modal */}
                {schedulePlace && (
                    <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">Schedule Activity</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    When do you want to visit <span className="font-semibold text-indigo-600">{schedulePlace.displayName.text}</span>?
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            {dateOptions.length > 0 ? (
                                                dateOptions.map((d) => (
                                                    <option key={d.toISOString()} value={format(d, 'yyyy-MM-dd')}>
                                                        {format(d, 'EEEE, MMM d')}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value={startDate ? startDate.split('T')[0] : ''}>
                                                    {startDate ? format(new Date(startDate), 'MMM d') : 'Day 1'}
                                                </option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Est. Cost / Person</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={scheduleCost}
                                            onChange={(e) => setScheduleCost(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-7 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setSchedulePlace(null)}
                                    disabled={isScheduling}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSchedule}
                                    disabled={isScheduling}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-0">
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
                <div className="p-4 bg-gray-50 border-b border-gray-100 z-0">
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
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px] z-0">
                    {places.length === 0 && !loading && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3">
                            <div className="p-4 bg-gray-100 rounded-full">
                                <MapPin className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No results found</p>
                            <p className="text-sm">
                                We couldn&apos;t find &quot;{activityName}&quot; near {selectedLocation}.
                            </p>
                        </div>
                    )}

                    {error && (
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
                    )}

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
                                    {isEditable && tripId && (
                                        <button
                                            onClick={() => handleAddToAgenda(place)}
                                            disabled={addingToAgenda === place.displayName.text}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md shadow-sm transition-colors whitespace-nowrap disabled:opacity-50"
                                        >
                                            {addingToAgenda === place.displayName.text ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Plus className="h-3 w-3" />
                                            )}
                                            <span>{enableScheduling ? 'Schedule' : 'Add to Agenda'}</span>
                                        </button>
                                    )}
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

                    {/* Load More / Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="animate-pulse text-sm">Finding more spots...</p>
                        </div>
                    )}

                    {!loading && nextPageToken && (
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => handleSearch(selectedLocation, nextPageToken)}
                                className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-700 font-medium rounded-full hover:bg-indigo-50 hover:shadow-sm transition-all flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Find More Results
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 bg-gray-50 rounded-b-xl z-0">
                    <span>Results provided by Google Places</span>
                    <img src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" alt="Powered by Google" className="h-4 opacity-70" />
                </div>
            </div >
        </div >
    )
}

