'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Save, MapPin, Check, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Activity {
    id: string
    name: string
    category: string | null
    requires_gps: boolean
}

interface Trip {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    is_public: boolean
    activities: string[] | null
    locations: string[] | null
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
    const [selectedActivities, setSelectedActivities] = useState<string[]>(trip?.activities || [])
    const [locations, setLocations] = useState<string[]>(trip?.locations || [])
    const [newLocation, setNewLocation] = useState('')
    const [availableActivities, setAvailableActivities] = useState<Activity[]>([])

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
            setLocations(prev => [...prev, newLocation.trim()])
            setNewLocation('')
        }
    }

    const removeLocation = (index: number) => {
        setLocations(prev => prev.filter((_, i) => i !== index))
    }

    const toggleActivity = (activityName: string) => {
        setSelectedActivities(prev =>
            prev.includes(activityName)
                ? prev.filter(a => a !== activityName)
                : [...prev, activityName]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const tripData = {
                name,
                description,
                start_date: startDate || null,
                end_date: endDate || null,
                is_public: isPublic,
                activities: selectedActivities,
                locations: locations,
                owner_id: userId,
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
                    <label className="block text-sm font-medium leading-6 text-gray-900 mb-4">
                        Select Activities
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {availableActivities.map((activity) => {
                            const isSelected = selectedActivities.includes(activity.name)
                            return (
                                <div
                                    key={activity.id}
                                    onClick={() => toggleActivity(activity.name)}
                                    className={`
                                        cursor-pointer relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                                        ${isSelected
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300 bg-white'
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 text-indigo-600">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                    <span className="font-medium text-center text-gray-900 text-sm">
                                        {activity.name}
                                    </span>
                                    {activity.requires_gps && (
                                        <div className="mt-2 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            GPS
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {availableActivities.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No activities available. Create them in the Admin Dashboard.</p>
                    )}
                </div>

                <div>
                    <label htmlFor="locations" className="block text-sm font-medium leading-6 text-gray-900">
                        Locations
                    </label>
                    <div className="mt-2 space-y-3">
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
                                placeholder="City, State (e.g. Austin, TX)"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                            <button
                                type="button"
                                onClick={handleAddLocation}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {locations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {locations.map((loc, index) => (
                                    <div key={index} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                        <MapPin className="h-3 w-3" />
                                        {loc}
                                        <button
                                            type="button"
                                            onClick={() => removeLocation(index)}
                                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove location</span>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium leading-6 text-gray-900">
                            Start Date
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
                            End Date
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
                            Make this trip public
                        </label>
                        <p className="text-gray-500">Public trips are visible to anyone on the platform.</p>
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
