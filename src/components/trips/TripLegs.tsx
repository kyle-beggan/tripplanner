'use client'

import { useState } from 'react'
import { Calendar, Clock, BedDouble, Plus } from 'lucide-react'
import { format } from 'date-fns'
import TripActivityCard from '@/components/trips/TripActivityCard'
import LodgingCard from '@/components/trips/LodgingCard'
import LodgingSearchModal from '@/components/trips/LodgingSearchModal'
import { useRouter } from 'next/navigation'

interface ScheduledActivity {
    time: string
    description: string
}

interface DailySchedule {
    date: string
    activities: ScheduledActivity[]
}

interface Lodging {
    id: string
    name: string
    address: string
    type: 'hotel' | 'airbnb' | 'other' | 'custom'
    price_level?: number
    total_cost?: number
    rating?: number
    user_rating_count?: number
    google_maps_uri?: string
    website_uri?: string
    booked: boolean
}

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
    schedule?: DailySchedule[]
    lodging?: Lodging[]
}

interface TripLegsProps {
    legs: TripLeg[]
    tripId: string
    isEditable: boolean
    activityMap: Map<string, any>
}

export default function TripLegs({ legs, tripId, isEditable, activityMap }: TripLegsProps) {
    const router = useRouter()
    const [searchModalOpen, setSearchModalOpen] = useState(false)
    const [activeLegIndex, setActiveLegIndex] = useState<number | null>(null)

    const handleOpenSearch = (index: number) => {
        setActiveLegIndex(index)
        setSearchModalOpen(true)
    }

    const formatDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy') => {
        if (!dateString) return ''
        try {
            const datePart = dateString.split('T')[0]
            const parts = datePart.split('-')
            if (parts.length !== 3) return ''
            const [year, month, day] = parts.map(Number)
            return format(new Date(year, month - 1, day), formatStr)
        } catch (e) {
            return ''
        }
    }

    if (legs.length === 0) {
        return <p className="text-gray-500 italic">No locations added to this trip yet.</p>
    }

    return (
        <div className="space-y-12">
            {legs.map((leg, index) => (
                <div key={index} className="relative pl-8 border-l-2 border-indigo-100 last:border-0 pb-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{leg.name}</h3>
                            <p className="text-sm text-indigo-600 font-medium flex items-center gap-1.5 mt-1">
                                <Calendar className="h-4 w-4" />
                                {leg.start_date ? formatDate(leg.start_date, 'MMM d') : 'TBD'}
                                {leg.end_date && ` - ${formatDate(leg.end_date, 'MMM d, yyyy')}`}
                            </p>
                        </div>
                    </div>

                    {/* Daily Schedule Timeline */}
                    {leg.schedule && leg.schedule.some(s => s.activities && s.activities.length > 0) && (
                        <div className="mb-12 space-y-10">
                            {leg.schedule.filter(s => s.activities && s.activities.length > 0).map((day, dIdx) => (
                                <div key={dIdx} className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDate(day.date, 'EEEE, MMM d')}
                                    </h4>
                                    <div className="space-y-0 relative">
                                        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-indigo-50" />
                                        {day.activities.map((item, iIdx) => (
                                            <div key={iIdx} className="relative flex items-start gap-4 py-3 group">
                                                <div className="w-20 pt-1 text-[10px] font-bold text-indigo-400 text-right tabular-nums uppercase">
                                                    {(() => {
                                                        const [h] = item.time.split(':')
                                                        const hour = parseInt(h)
                                                        const ampm = hour >= 12 ? 'PM' : 'AM'
                                                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
                                                        return `${displayHour}:00 ${ampm}`
                                                    })()}
                                                </div>
                                                <div className="relative z-10 mt-1.5 w-2 h-2 rounded-full bg-indigo-200 ring-4 ring-white group-hover:bg-indigo-600 transition-colors" />
                                                <div className="flex-1 bg-gray-50 rounded-lg p-3 group-hover:bg-indigo-50/50 transition-colors border border-transparent group-hover:border-indigo-100">
                                                    <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Lodging Section */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                <BedDouble className="w-4 h-4" />
                                Lodging
                            </label>
                            {isEditable && (
                                <button
                                    onClick={() => handleOpenSearch(index)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    Find Lodging
                                </button>
                            )}
                        </div>

                        {leg.lodging && leg.lodging.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {leg.lodging.map((l) => (
                                    <LodgingCard
                                        key={l.id}
                                        lodging={l}
                                        tripId={tripId}
                                        legIndex={index}
                                        isEditable={isEditable}
                                        onUpdate={() => router.refresh()}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500 italic">No lodging selected for this leg yet.</p>
                                {isEditable && (
                                    <button
                                        onClick={() => handleOpenSearch(index)}
                                        className="mt-2 text-sm text-indigo-600 font-medium hover:underline"
                                    >
                                        Find a place to stay
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Leg Activities Grid */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                            Available Activities
                        </label>
                        {leg.activities && leg.activities.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {leg.activities.map((activityName, actIdx) => {
                                    const activityDetails = activityMap.get(activityName)
                                    return (
                                        <TripActivityCard
                                            key={actIdx}
                                            name={activityName}
                                            requiresGps={!!activityDetails?.requires_gps}
                                            locations={[leg.name]}
                                            tripId={tripId}
                                            isEditable={isEditable}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No activities planned for this leg.</p>
                        )}
                    </div>
                </div>
            ))}

            {activeLegIndex !== null && (
                <LodgingSearchModal
                    isOpen={searchModalOpen}
                    onClose={() => {
                        setSearchModalOpen(false)
                        setActiveLegIndex(null)
                    }}
                    locationName={legs[activeLegIndex].name}
                    tripId={tripId}
                    legIndex={activeLegIndex}
                    initialStartDate={legs[activeLegIndex].start_date}
                    initialEndDate={legs[activeLegIndex].end_date}
                    onAdd={() => {
                        router.refresh()
                        // Optional: close modal on add? maybe keep open for alternatives
                    }}
                />
            )}
        </div>
    )
}
