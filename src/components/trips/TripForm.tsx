'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Save, MapPin, Check, Plus, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import LegItineraryBuilder from './LegItineraryBuilder'

interface ScheduledActivity {
    time: string
    description: string
    estimated_cost?: number
    location_name?: string
}

interface DailySchedule {
    date: string
    activities: ScheduledActivity[]
}

interface Activity {
    id: string
    name: string
    category: string | null
    requires_gps: boolean
}

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
    schedule?: DailySchedule[]
}

interface Trip {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    is_public: boolean
    activities: string[] | null
    locations: TripLeg[] | null
    agenda: any[] | null
    destination_airport_code: string | null
    estimated_participants: number | null
}

interface TripFormProps {
    userId: string
    trip?: Trip
}

export default function TripForm({ userId, trip }: TripFormProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState(trip?.name || '')
    const [description, setDescription] = useState(trip?.description || '')
    const [startDate, setStartDate] = useState(trip?.start_date || '')
    const [endDate, setEndDate] = useState(trip?.end_date || '')
    const [isPublic, setIsPublic] = useState(trip?.is_public || false)
    const [estimatedParticipants, setEstimatedParticipants] = useState<number | ''>(trip?.estimated_participants || '')
    const [destinationAirportCode, setDestinationAirportCode] = useState(trip?.destination_airport_code || '')
    const [locations, setLocations] = useState<TripLeg[]>(trip?.locations || [])
    const [newLocation, setNewLocation] = useState('')
    const [availableActivities, setAvailableActivities] = useState<Activity[]>([])
    const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null)

    useEffect(() => {
        const fetchActivities = async () => {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('name', { ascending: true })

            if (!error && data) {
                setAvailableActivities(data)
            }
        }
        fetchActivities()
    }, [supabase])

    const handleAddLocation = () => {
        if (newLocation.trim()) {
            const leg: TripLeg = {
                name: newLocation.trim(),
                start_date: startDate || null,
                end_date: endDate || null,
                activities: []
            }
            setLocations(prev => [...prev, leg])
            setNewLocation('')
        }
    }

    const removeLocation = (index: number) => {
        setLocations(prev => prev.filter((_, i) => i !== index))
    }

    const updateLeg = (index: number, updates: Partial<TripLeg>) => {
        setLocations(prev => {
            const next = [...prev]
            next[index] = { ...next[index], ...updates }
            return next
        })
    }

    const toggleLegActivity = (legIndex: number, activityName: string) => {
        const leg = locations[legIndex]
        const nextActivities = leg.activities.includes(activityName)
            ? leg.activities.filter(a => a !== activityName)
            : [...leg.activities, activityName]
        updateLeg(legIndex, { activities: nextActivities })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (locations.length === 0) {
            toast.error('At least one location is required')
            setError('Please add at least one location before saving.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const tripData = {
                name,
                description,
                start_date: startDate || null,
                end_date: endDate || null,
                is_public: isPublic,
                locations: locations,
                agenda: trip?.agenda || [],
                owner_id: userId,
                estimated_participants: estimatedParticipants === '' ? null : Number(estimatedParticipants),
                destination_airport_code: destinationAirportCode ? destinationAirportCode.toUpperCase() : null,
                updated_at: new Date().toISOString(),
            }

            if (trip) {
                // Update existing trip
                const { error: updateError } = await supabase
                    .from('trips')
                    .update(tripData)
                    .eq('id', trip.id)

                if (updateError) throw updateError

                toast.success('Trip updated successfully')
                router.push(`/trips/${trip.id}`)
                router.refresh()
            } else {
                // Create new trip
                const { data, error: insertError } = await supabase
                    .from('trips')
                    .insert([tripData])
                    .select()
                    .single()

                if (insertError) throw insertError

                // Add owner as a participant automatically
                if (data) {
                    const { error: participantError } = await supabase
                        .from('trip_participants')
                        .insert({
                            trip_id: data.id,
                            user_id: userId,
                            status: 'going',
                            role: 'owner'
                        })

                    if (participantError) console.error('Error adding owner as participant:', participantError)

                    toast.success('Trip created successfully')
                    router.push(`/trips/${data.id}`)
                    router.refresh()
                }
            }
        } catch (err: any) {
            console.error('Error saving trip:', err)
            const message = err.message || 'Failed to save trip'
            toast.error(message)
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                        Trip Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                        <input
                            type="text"
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Summer Road Trip 2024"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium leading-6 text-gray-900">
                            Trip Start Date
                        </label>
                        <div className="mt-2 relative">
                            <input
                                type="date"
                                id="start_date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium leading-6 text-gray-900">
                            Trip End Date
                        </label>
                        <div className="mt-2 relative">
                            <input
                                type="date"
                                id="end_date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                        Description
                    </label>
                    <div className="mt-2">
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's the plan?"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="estimated_participants" className="block text-sm font-medium leading-6 text-gray-900">
                        Estimated Number of Participants
                    </label>
                    <div className="mt-2">
                        <input
                            type="number"
                            id="estimated_participants"
                            min="1"
                            value={estimatedParticipants}
                            onChange={(e) => setEstimatedParticipants(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 5"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <p className="mt-1 text-xs text-gray-500">Helps with cost estimation.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label htmlFor="locations" className="block text-sm font-medium leading-6 text-gray-900 font-bold">
                        Trip Itinerary & Legs <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-500 mb-4">Add the locations you&apos;ll be visiting. You can set specific dates and activities for each leg.</p>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="locations"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddLocation()
                                }
                            }}
                            placeholder="Add a location (e.g. Austin, TX)"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <button
                            type="button"
                            onClick={handleAddLocation}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="ml-2">Add Leg</span>
                        </button>
                    </div>

                    <div className="space-y-6 mt-6">
                        {locations.map((leg, index) => (
                            <div key={index} className="relative bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => removeLocation(index)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">{leg.name}</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                            Leg Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={leg.start_date || ''}
                                            min={startDate}
                                            max={leg.end_date || endDate || undefined}
                                            onChange={(e) => updateLeg(index, { start_date: e.target.value })}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                            Leg End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={leg.end_date || ''}
                                            min={leg.start_date || startDate || undefined}
                                            max={endDate}
                                            onChange={(e) => updateLeg(index, { end_date: e.target.value })}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                        Activities for this Leg
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableActivities.map((activity) => {
                                            const isSelected = leg.activities.includes(activity.name)
                                            return (
                                                <button
                                                    key={activity.id}
                                                    type="button"
                                                    onClick={() => toggleLegActivity(index, activity.name)}
                                                    className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                        ${isSelected
                                                            ? 'bg-indigo-600 text-white ring-1 ring-indigo-600'
                                                            : 'bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}
                                                    `}
                                                >
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                    {activity.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        {leg.schedule && leg.schedule.some(s => s.activities.length > 0) ? (
                                            <span className="text-indigo-600 font-semibold">Daily planning in progress</span>
                                        ) : (
                                            <span>No daily schedule planned</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingLegIndex(index)}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Edit Daily Schedule
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Itinerary Builder Overlay */}
                {editingLegIndex !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-4xl">
                            <LegItineraryBuilder
                                legName={locations[editingLegIndex].name}
                                startDate={locations[editingLegIndex].start_date || startDate}
                                endDate={locations[editingLegIndex].end_date || endDate}
                                legActivities={locations[editingLegIndex].activities}
                                initialSchedule={locations[editingLegIndex].schedule}
                                onSave={(schedule) => {
                                    updateLeg(editingLegIndex, { schedule })
                                    setEditingLegIndex(null)
                                    toast.success('Daily schedule updated')
                                }}
                                onCancel={() => setEditingLegIndex(null)}
                            />
                        </div>
                    </div>
                )}


                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="is_public"
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="is_public" className="font-medium text-gray-900">
                            Make this trip public?
                        </label>
                        <p className="text-gray-500">Public trips can be viewed by anyone with the link.</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-medium leading-6 text-gray-900 font-bold mb-4">
                        Flight Estimation Settings
                    </h3>
                    <div>
                        <label htmlFor="destination_airport_code" className="block text-sm font-medium leading-6 text-gray-900">
                            Destination Airport Code (Optional)
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="destination_airport_code"
                                value={destinationAirportCode}
                                onChange={(e) => setDestinationAirportCode(e.target.value.toUpperCase())}
                                placeholder="e.g. LHR, JFK"
                                maxLength={3}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 uppercase"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Providing this helps us give you more accurate flight estimates if we can&apos;t detect it from your itinerary.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error saving trip</h3>
                            <div className="mt-2 text-sm text-red-700">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm font-semibold leading-6 text-gray-900"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {trip ? 'Update Trip' : 'Create Trip'}
                </button>
            </div>
        </form>
    )
}
