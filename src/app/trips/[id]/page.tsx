import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowLeft, User, Star, Clock, Camera, Users, ImageIcon } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import TripRSVPButton from '@/components/trips/TripRSVPButton'
import TripLegs from '@/components/trips/TripLegs'
import TripInviteButton from '@/components/trips/TripInviteButton'
import TripCostSummary from '@/components/trips/TripCostSummary'
import FlightEstimateCard from '@/components/trips/FlightEstimateCard'
import { getEstimateFlightPrice } from '@/app/trips/flight-actions'
import TripJoinAllButton from '@/components/trips/TripJoinAllButton'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import TripPhotosSection from '@/components/trips/TripPhotosSection'
import TripDetailsSection from '@/components/trips/TripDetailsSection'
import LiveTripStatus from '@/components/trips/LiveTripStatus'

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

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
    schedule?: DailySchedule[]
    lodging?: Lodging[]
}

interface Lodging {
    id: string
    name: string
    address: string
    type: 'hotel' | 'airbnb' | 'other'
    price_level?: number
    rating?: number
    user_rating_count?: number
    google_maps_uri?: string
    website_uri?: string
    booked: boolean
    estimated_cost_per_person?: number
    total_cost?: number
}

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function TripDetailsPage({ params }: PageProps) {
    const supabase = await createClient()
    const { id: rawId } = await params
    const id = typeof rawId === 'string' ? rawId.trim() : ''

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('TripDetailsPage - Diagnostics:', {
        id,
        userId: user?.id,
        authError: authError?.message
    })

    if (!id || id.length < 32) {
        console.error('Invalid ID:', id)
        notFound()
    }

    // Fetch core data in parallel
    const [
        { data: trip, error: tripError },
        { data: profile },
        { data: participantsData, error: participantsError },
        { data: activitiesData }
    ] = await Promise.all([
        supabase.from('trips').select('*').eq('id', id).single(),
        supabase.from('profiles').select('role, home_airport').eq('id', user?.id || '00000000-0000-0000-0000-000000000000').single(),
        supabase.from('trip_participants').select(`
            *,
            profile:profiles!trip_participants_user_id_fkey(
                first_name,
                last_name,
                full_name,
                avatar_url,
                username
            )
        `).eq('trip_id', id),
        supabase.from('activities').select('name, requires_gps').order('name', { ascending: true })
    ])

    if (tripError || !trip) {
        console.error('Trip fetch error details:', {
            message: tripError?.message,
            details: tripError?.details,
            hint: tripError?.hint,
            code: tripError?.code
        })
        notFound()
    }

    if (participantsError) {
        console.error('Participants fetch error:', participantsError)
    }

    // Fetch owner profile (depends on trip data)
    const { data: owner } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', trip.owner_id)
        .single()

    const isOwner = user?.id === trip.owner_id
    const isAdmin = profile?.role === 'admin'
    const isEditable = isOwner || isAdmin

    const legs = Array.isArray(trip.locations) ? (trip.locations as TripLeg[]) : []
    const tripActivities = Array.isArray(trip.activities) ? (trip.activities as string[]) : []

    const activityMap = new Map((activitiesData || []).map(a => [a.name, a]))

    // Process participants
    const participants = participantsData || []

    // Helper to format dates consistently without timezone shifts
    const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy') => {
        if (!dateString) return ''
        try {
            const datePart = dateString.split('T')[0]
            const parts = datePart.split('-')
            if (parts.length !== 3) return ''
            const [year, month, day] = parts.map(Number)
            if (isNaN(year) || isNaN(month) || isNaN(day)) return ''
            const date = new Date(year, month - 1, day)
            if (isNaN(date.getTime())) return ''
            return format(date, formatStr)
        } catch (e) {
            console.error('Date formatting error:', e)
            return ''
        }
    }

    const going = participants.filter(p => p.status === 'going')
    const notComing = participants.filter(p => p.status === 'declined')

    const totalConfirmed = going.reduce((acc, p) => {
        const guestCount = Array.isArray(p.guests) ? p.guests.length : 0
        return acc + 1 + guestCount
    }, 0)



    // Calculate estimated costs
    // 1. Lodging: Sum of all total_cost / estimated participants
    // User request: "The estimated cost for lodging should be the total of all lodging entries for the entire trip divided by the estimated number of participants for the trip."

    const estimatedParticipantsCount = trip.estimated_participants || 1 // Fallback to 1 to avoid division by zero

    // 1. Lodging: 
    // - Hotels: (estimated_cost_per_person * nights)
    // - Airbnbs/Other: (total_cost / estimated participants)

    const lodgingEstPerPerson = legs.reduce((totalPerPerson, leg) => {
        const legLodging = leg.lodging || []

        let nights = 0
        if (leg.start_date && leg.end_date) {
            nights = differenceInDays(new Date(leg.end_date), new Date(leg.start_date))
        }

        const legCostPerPerson = legLodging.reduce((acc, l) => {
            if (l.type === 'hotel') {
                // Hotel cost is entered as per person PER NIGHT
                return acc + ((l.estimated_cost_per_person || 0) * nights)
            } else {
                // Airbnb/Other is entered as TOTAL trip cost
                return acc + ((l.total_cost || 0) / estimatedParticipantsCount)
            }
        }, 0)

        return totalPerPerson + legCostPerPerson
    }, 0)

    // 2. Activities: Sum of all estimated_cost in schedule
    // Calculate total potential cost (if one did everything) AND personal cost (what they opted into)
    let totalActivityPotential = 0
    let myActivityCost = 0

    legs.forEach(leg => {
        const schedule = leg.schedule || []
        schedule.forEach(day => {
            day.activities.forEach(act => {
                const cost = act.estimated_cost || 0
                totalActivityPotential += cost

                // If user is participating, add to their personal total
                const actParticipants = (act as any).participants || [] // Type cast needed until ScheduleActivity interface updated fully in this file
                if (user && actParticipants.includes(user.id)) {
                    myActivityCost += cost
                }
            })
        })
    })

    const userParticipation = user ? participants.find(p => p.user_id === user.id) : null

    // Calculate activity participation stats
    let totalActivities = 0
    let joinedActivities = 0
    let hasActivities = false

    if (user) {
        legs.forEach(leg => {
            const schedule = leg.schedule || []
            schedule.forEach(day => {
                if (day.activities && day.activities.length > 0) {
                    day.activities.forEach(act => {
                        totalActivities++
                        const actParticipants = (act as any).participants || []
                        if (actParticipants.includes(user.id)) {
                            joinedActivities++
                        }
                    })
                }
            })
        })

        if (totalActivities > 0) {
            hasActivities = true
        }
    }


    // Flight estimates are now handled client-side on-demand to speed up page load
    const flightEstimate = null
    const flightCost = null

    // Aggregate all photos from all activities
    const allPhotos: { url: string; activityName: string }[] = []
    legs.forEach(leg => {
        leg.schedule?.forEach(day => {
            day.activities.forEach((act: any) => {
                if (act.photos && Array.isArray(act.photos)) {
                    act.photos.forEach((url: string) => {
                        allPhotos.push({
                            url,
                            activityName: act.description
                        })
                    })
                }
            })
        })
    })
    // Live Trip Detection
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')

    let isLive = false
    let currentActivity = null
    let nextActivity = null
    let currentDayLeg = null

    if (trip.start_date && trip.end_date) {
        const tripStart = new Date(trip.start_date)
        const tripEnd = new Date(trip.end_date)
        // Set to start/end of day to be inclusive
        tripStart.setHours(0, 0, 0, 0)
        tripEnd.setHours(23, 59, 59, 999)

        isLive = now >= tripStart && now <= tripEnd
    }

    if (isLive) {
        // Find today's activities to show Now/Next
        legs.forEach(leg => {
            leg.schedule?.forEach(day => {
                if (day.date.split('T')[0] === todayStr) {
                    currentDayLeg = leg
                    const sortedActs = [...day.activities].sort((a, b) => a.time.localeCompare(b.time))

                    const nowTime = format(now, 'HH:mm')

                    // Find current (last one that has passed)
                    for (let i = 0; i < sortedActs.length; i++) {
                        if (sortedActs[i].time <= nowTime) {
                            currentActivity = sortedActs[i]
                        } else {
                            nextActivity = sortedActs[i]
                            break
                        }
                    }
                }
            })
        })
    }

    return (
        <div className="min-h-full pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-4">
                        <Link href="/trips" className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Trips
                        </Link>
                    </div>
                    <div className="md:flex md:items-center md:justify-between">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-3xl font-bold leading-tight text-gray-900">
                                {trip.name}
                            </h1>
                            <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    {trip.start_date ? formatDate(trip.start_date) : 'TBD'}
                                    {trip.end_date && ` - ${formatDate(trip.end_date)}`}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    Hosted by {owner?.full_name || 'Unknown'}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <span className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                                        {totalConfirmed} {totalConfirmed === 1 ? 'Person' : 'People'} Going
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3 md:ml-4 md:mt-0">
                            {isOwner && (
                                <Link
                                    href={`/trips/${trip.id}/edit`}
                                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
                {isLive && (
                    <LiveTripStatus
                        currentActivity={currentActivity}
                        nextActivity={nextActivity}
                        tripId={trip.id}
                    />
                )}
                {/* Details & Cost Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <TripDetailsSection
                            tripId={trip.id}
                            tripName={trip.name}
                            description={trip.description}
                            legs={legs}
                            startDate={trip.start_date}
                            endDate={trip.end_date}
                            participants={participants}
                            isEditable={isEditable}
                            isLive={isLive}
                        />
                    </div>

                    {/* Right Column: Cost Summary */}
                    <div>
                        <TripCostSummary
                            tripId={trip.id}
                            flightEstimate={flightCost}
                            lodgingEstPerPerson={lodgingEstPerPerson}
                            activityEstPerPerson={totalActivityPotential}
                            myActivityCost={myActivityCost}
                            estimatedParticipants={trip.estimated_participants || 0}
                            initialIsFlying={userParticipation?.is_flying}
                        />
                    </div>
                </div>

                {/* Flight Estimate Row */}
                <section>
                    <FlightEstimateCard
                        tripId={trip.id}
                        initialEstimate={flightEstimate}
                        hasHomeAirport={!!profile?.home_airport}
                    />
                </section>

                {/* Itinerary Section */}
                <section className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            Trip Itinerary
                        </h2>
                        {hasActivities && user && (
                            <TripJoinAllButton
                                tripId={trip.id}
                                joinedCount={joinedActivities}
                                totalCount={totalActivities}
                            />
                        )}
                    </div>

                    <TripLegs
                        legs={legs}
                        tripId={trip.id}
                        isEditable={isEditable}
                        canManageBooking={isOwner || isAdmin}
                        activityMap={activityMap}
                        userId={user?.id}
                        participants={participants}
                    />
                </section>

                {/* Aggregate Photos Section */}
                <CollapsibleSection
                    title="Photos"
                    badge={allPhotos.length}
                    icon={<ImageIcon className="w-5 h-5 text-indigo-500" />}
                >
                    <TripPhotosSection photos={allPhotos} />
                </CollapsibleSection>

                {/* Who's Coming Section */}
                <CollapsibleSection
                    title="Who's Coming"
                    badge={`${totalConfirmed} confirmed`}
                    icon={<Users className="w-5 h-5 text-indigo-500" />}
                    headerAction={
                        <TripInviteButton
                            tripId={trip.id}
                            tripName={trip.name}
                            isOwnerOrAdmin={isOwner || isAdmin}
                        />
                    }
                >
                    {going.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {going.map((participant) => (
                                <div key={participant.id} className="flex flex-col items-center p-4 rounded-lg border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow text-center">
                                    <div className="flex-shrink-0 mb-3">
                                        {participant.profile?.avatar_url ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={participant.profile.avatar_url}
                                                    alt={participant.profile.full_name || participant.profile.username || 'User avatar'}
                                                    className="h-16 w-16 rounded-full object-cover bg-gray-100 ring-2 ring-white"
                                                />
                                            </>
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl ring-2 ring-white">
                                                {participant.profile?.full_name?.charAt(0) || participant.profile?.username?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {participant.profile?.full_name || participant.profile?.username || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-indigo-600 font-medium mb-1">
                                            {participant.role === 'owner' ? 'Host' : 'Guest'}
                                        </p>
                                        {participant.arrival_date && participant.departure_date && (
                                            <p className="text-xs text-gray-500">
                                                {formatDate(participant.arrival_date, 'MMM d')} - {formatDate(participant.departure_date, 'MMM d')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No one has RSVP&apos;d yet. Be the first!</p>
                    )}
                </CollapsibleSection>

                {/* Who's Not Coming Section */}
                {notComing.length > 0 && (
                    <CollapsibleSection
                        title="Who's Not Coming"
                        badge={`${notComing.length} declined`}
                        icon={<Users className="w-5 h-5 text-red-500" />}
                    >
                        <div className="flex flex-wrap gap-3">
                            {notComing.map((participant) => (
                                <div key={participant.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                                    <div className="flex-shrink-0">
                                        {participant.profile?.avatar_url ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={participant.profile.avatar_url}
                                                    alt={participant.profile.username}
                                                    className="h-6 w-6 rounded-full object-cover bg-gray-100 ring-1 ring-white"
                                                />
                                            </>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px] ring-1 ring-white">
                                                {participant.profile?.full_name?.charAt(0) || participant.profile?.username?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                        {participant.profile?.full_name || participant.profile?.username || 'Unknown User'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>
                )}
            </div>
        </div>
    )
}
