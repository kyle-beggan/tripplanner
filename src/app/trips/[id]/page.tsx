import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowLeft, User } from 'lucide-react'
import { format } from 'date-fns'
import TripRSVPButton from '@/components/trips/TripRSVPButton'
import TripActivityCard from '@/components/trips/TripActivityCard'

interface PageProps {
    params: {
        id: string
    }
}

export default async function TripDetailsPage({ params }: PageProps) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch trip and owner
    const { data: trip, error } = await supabase
        .from('trips')
        .select(`
            *,
            owner:profiles!trips_owner_id_fkey(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

    if (error || !trip) {
        notFound()
    }

    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = user?.id === trip.owner_id

    // Fetch participants with their profiles
    const { data: participantsData } = await supabase
        .from('trip_participants')
        .select(`
            *,
            profile:profiles!trip_participants_user_id_fkey(
                first_name,
                last_name,
                full_name,
                avatar_url,
                username
            )
        `)
        .eq('trip_id', trip.id)

    // Fetch full activity objects to check GPS requirement
    const { data: activitiesData } = await supabase
        .from('activities')
        .select('name, requires_gps')
        .in('name', trip.activities || [])

    // Create a map for quick activity lookup
    const activityMap = new Map(activitiesData?.map(a => [a.name, a]))


    // Process participants
    const participants = participantsData || []
    // Helper to format dates consistently without timezone shifts
    const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy') => {
        if (!dateString) return ''
        try {
            // Handle ISO strings (e.g. 2024-01-01T00:00:00+00:00) by taking only the date part
            const datePart = dateString.split('T')[0]
            const parts = datePart.split('-')

            if (parts.length !== 3) return ''
            const [year, month, day] = parts.map(Number)

            if (isNaN(year) || isNaN(month) || isNaN(day)) return ''

            // Create date ensuring month is 0-indexed (local time)
            const date = new Date(year, month - 1, day)

            // Check if date is valid
            if (isNaN(date.getTime())) return ''

            return format(date, formatStr)
        } catch (e) {
            console.error('Date formatting error:', e)
            return ''
        }
    }

    const going = participants.filter(p => p.status === 'going')
    const notComing = participants.filter(p => p.status === 'declined')

    // Calculate total confirmed (participants + their guests)
    const totalConfirmed = going.reduce((acc, p) => {
        const guestCount = Array.isArray(p.guests) ? p.guests.length : 0
        return acc + 1 + guestCount
    }, 0)

    // Find current user's participation for the button
    const userParticipation = user ? participants.find(p => p.user_id === user.id) : null

    return (
        <div className="min-h-full pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-4">
                        <Link href="/trips" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Trips
                        </Link>
                    </div>
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                                {trip.name}
                            </h1>
                            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    {trip.start_date ? formatDate(trip.start_date) : 'TBD'}
                                    {trip.end_date && ` - ${formatDate(trip.end_date)}`}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    Hosted by {trip.owner?.full_name || 'Unknown'}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                                        {totalConfirmed} {totalConfirmed === 1 ? 'Person' : 'People'} Going
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3 md:ml-4 md:mt-0">
                            {isOwner && (
                                <Link
                                    href={`/trips/${trip.id}/edit`}
                                    className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Edit Trip
                                </Link>
                            )}
                            <TripRSVPButton
                                trip={trip}
                                initialData={userParticipation}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Details Section */}
                <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        {trip.description ? (
                            <p className="whitespace-pre-wrap">{trip.description}</p>
                        ) : (
                            <p className="italic text-gray-500">No description provided.</p>
                        )}

                    </div>
                </section>

                {/* Location Section */}
                {(() => {
                    // Normalize locations to ensure we handle both legacy single location and new array
                    const locations = Array.isArray(trip.locations) && trip.locations.length > 0
                        ? trip.locations
                        : trip.location
                            ? [trip.location]
                            : []

                    if (locations.length === 0) return null

                    return (
                        <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Location{locations.length > 1 ? 's' : ''}
                            </h2>
                            {locations.length > 1 ? (
                                <div className="flex flex-wrap gap-3">
                                    {locations.map((loc: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full px-4 py-2 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/30">
                                            <MapPin className="h-4 w-4" />
                                            <span className="font-medium">{loc}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                                    <MapPin className="h-6 w-6 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-lg">{locations[0]}</span>
                                </div>
                            )}
                        </section>
                    )
                })()}

                {/* Who's Coming Section */}
                <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who&apos;s Coming</h2>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            {totalConfirmed} confirmed
                        </span>
                    </div>

                    {going.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {going.map((participant) => (
                                <div key={participant.id} className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-shadow text-center">
                                    <div className="flex-shrink-0 mb-3">
                                        {participant.profile?.avatar_url ? (
                                            <img
                                                src={participant.profile.avatar_url}
                                                alt={participant.profile.full_name}
                                                className="h-16 w-16 rounded-full object-cover bg-gray-100 ring-2 ring-white dark:ring-gray-800"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xl ring-2 ring-white dark:ring-gray-800">
                                                {participant.profile?.full_name?.charAt(0) || participant.profile?.username?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {participant.profile?.full_name || participant.profile?.username || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                                            {participant.role === 'owner' ? 'Host' : 'Guest'}
                                            {participant.guests && participant.guests.length > 0 && ` + ${participant.guests.length} ${participant.guests.length === 1 ? 'guest' : 'guests'}`}
                                        </p>
                                        {participant.arrival_date && participant.departure_date && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(participant.arrival_date, 'MMM d')} - {formatDate(participant.departure_date, 'MMM d')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No one has RSVP&apos;d yet. Be the first!</p>
                    )}
                </section>

                {/* Who's Not Coming Section */}
                {notComing.length > 0 && (
                    <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who&apos;s Not Coming</h2>
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                {notComing.length} declined
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {notComing.map((participant) => (
                                <div key={participant.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-full px-3 py-1">
                                    <div className="flex-shrink-0">
                                        {participant.profile?.avatar_url ? (
                                            <img
                                                src={participant.profile.avatar_url}
                                                alt={participant.profile.full_name}
                                                className="h-6 w-6 rounded-full object-cover bg-gray-200"
                                            />
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 font-bold">
                                                {participant.profile?.full_name?.charAt(0) || participant.profile?.username?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {participant.profile?.full_name || participant.profile?.username || 'Unknown'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Activities Section */}
                <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activities</h2>
                    {trip.activities && trip.activities.length > 0 ? (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {trip.activities.map((activityName: string, index: number) => {
                                const activityDetails = activityMap.get(activityName)
                                const requiresGps = activityDetails?.requires_gps

                                return (
                                    <li key={index} className="h-full">
                                        <TripActivityCard
                                            name={activityName}
                                            requiresGps={!!requiresGps}
                                            locations={trip.locations || (trip.location ? [trip.location] : [])}
                                        />
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No activities listed for this trip yet.</p>
                    )}
                </section>
            </div>
        </div>
    )
}
