'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X, Plus, Trash2, Loader2, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface TripRSVPModalProps {
    isOpen: boolean
    onClose: () => void
    trip: any // Using any for now to avoid strict type issues with new columns
    initialData?: any
}

interface Guest {
    name: string
    age: string
}

export default function TripRSVPModal({ isOpen, onClose, trip, initialData }: TripRSVPModalProps) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [status, setStatus] = useState<'going' | 'declined'>('going')
    const [arrivalDate, setArrivalDate] = useState('')
    const [departureDate, setDepartureDate] = useState('')
    const [guests, setGuests] = useState<Guest[]>([])
    const [selectedActivities, setSelectedActivities] = useState<string[]>([])

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            setStatus(initialData.status || 'going')
            setArrivalDate(initialData.arrival_date ? new Date(initialData.arrival_date).toISOString().split('T')[0] : '')
            setDepartureDate(initialData.departure_date ? new Date(initialData.departure_date).toISOString().split('T')[0] : '')
            setGuests(Array.isArray(initialData.guests) ? initialData.guests : [])
            setSelectedActivities(Array.isArray(initialData.interested_activities) ? initialData.interested_activities : [])
        } else {
            // Reset if no data (fresh RSVP)
            setStatus('going')
            setArrivalDate('')
            setDepartureDate('')
            setGuests([])
            setSelectedActivities([])
        }
    }, [initialData, isOpen])

    const handleAddGuest = () => {
        setGuests([...guests, { name: '', age: '' }])
    }

    const handleRemoveGuest = (index: number) => {
        setGuests(guests.filter((_, i) => i !== index))
    }

    const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
        const newGuests = [...guests]
        newGuests[index] = { ...newGuests[index], [field]: value }
        setGuests(newGuests)
    }

    const toggleActivity = (activity: string) => {
        if (selectedActivities.includes(activity)) {
            setSelectedActivities(selectedActivities.filter(a => a !== activity))
        } else {
            setSelectedActivities([...selectedActivities, activity])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('trip_participants')
                .upsert({
                    trip_id: trip.id,
                    user_id: user.id,
                    status,
                    arrival_date: arrivalDate || null,
                    departure_date: departureDate || null,
                    guests,
                    interested_activities: selectedActivities
                }, {
                    onConflict: 'trip_id,user_id'
                })

            if (error) throw error

            toast.success('RSVP updated successfully')
            router.refresh()
            onClose()
        } catch (error) {
            console.error('Error updating RSVP:', error)
            toast.error('Failed to save RSVP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-xl sm:p-6"
                    >
                        <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                    <DialogTitle as="h3" className="text-xl font-semibold leading-6 text-gray-900 mb-6">
                                        {initialData ? 'Update your RSVP' : 'RSVP for ' + trip.name}
                                    </DialogTitle>

                                    {/* Status Selection */}
                                    <div className="mb-6">
                                        <label className="text-base font-semibold text-gray-900">Are you going?</label>
                                        <div className="mt-2 flex gap-4">
                                            <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border py-3 text-sm font-medium sm:flex-initial sm:min-w-[120px] ${status === 'going' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="going"
                                                    checked={status === 'going'}
                                                    onChange={() => setStatus('going')}
                                                    className="sr-only"
                                                />
                                                <span>Yes, I&apos;m In!</span>
                                            </label>
                                            <label className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border py-3 text-sm font-medium sm:flex-initial sm:min-w-[120px] ${status === 'declined' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value="declined"
                                                    checked={status === 'declined'}
                                                    onChange={() => setStatus('declined')}
                                                    className="sr-only"
                                                />
                                                <span>Can&apos;t Make It</span>
                                            </label>
                                        </div>
                                    </div>

                                    {status === 'going' && (
                                        <>
                                            {/* Dates */}
                                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label htmlFor="arrival" className="block text-sm font-medium text-gray-700">Arrival Date</label>
                                                    <input
                                                        type="date"
                                                        id="arrival"
                                                        value={arrivalDate}
                                                        onChange={(e) => setArrivalDate(e.target.value)}
                                                        min={trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : undefined}
                                                        max={trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : undefined}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="departure" className="block text-sm font-medium text-gray-700">Departure Date</label>
                                                    <input
                                                        type="date"
                                                        id="departure"
                                                        value={departureDate}
                                                        onChange={(e) => setDepartureDate(e.target.value)}
                                                        min={trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : undefined}
                                                        max={trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : undefined}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Guests */}
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium text-gray-700">Guests in your group</label>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddGuest}
                                                        className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        <Plus className="mr-1 h-3 w-3" />
                                                        Add Member
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {guests.length === 0 && (
                                                        <p className="text-sm text-gray-500 italic">Just you for now.</p>
                                                    )}
                                                    {guests.map((guest, index) => (
                                                        <div key={index} className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="Name"
                                                                value={guest.name}
                                                                onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Age"
                                                                value={guest.age}
                                                                onChange={(e) => handleGuestChange(index, 'age', e.target.value)}
                                                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveGuest(index)}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Activities */}
                                            {trip.activities && trip.activities.length > 0 && (
                                                <div className="mb-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Interested Activities</label>
                                                    <div className="space-y-2">
                                                        {trip.activities.map((activity: string, index: number) => (
                                                            <label key={index} className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedActivities.includes(activity)}
                                                                    onChange={() => toggleActivity(activity)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-900">{activity}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save RSVP
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
