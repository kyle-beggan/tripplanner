'use client'

import { useState } from 'react'
import { Calendar, Clock, BedDouble, Plus, MapPin, Search, List, Hotel, Tent } from 'lucide-react'
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

interface TripLegItemProps {
    leg: TripLeg
    tripId: string
    legIndex: number
    isEditable: boolean
    canManageBooking: boolean
    activityMap: Map<string, any>
}

export default function TripLegItem({
    leg,
    tripId,
    legIndex,
    isEditable,
    canManageBooking,
    activityMap
}: TripLegItemProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'schedule' | 'lodging' | 'activities'>('schedule')
    const [searchModalOpen, setSearchModalOpen] = useState(false)

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

    return (
        <div className="relative pl-8 border-l-2 border-indigo-100 last:border-0 pb-12">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{leg.name}</h3>
                    <p className="text-sm text-indigo-600 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar className="h-4 w-4" />
                        {leg.start_date ? formatDate(leg.start_date, 'MMM d') : 'TBD'}
                        {leg.end_date && ` - ${formatDate(leg.end_date, 'MMM d, yyyy')}`}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'schedule'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <List className="h-4 w-4" />
                    Daily Schedule
                </button>
                <button
                    onClick={() => setActiveTab('lodging')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'lodging'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Hotel className="h-4 w-4" />
                    Lodging
                    {leg.lodging && leg.lodging.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                            {leg.lodging.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('activities')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'activities'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <Search className="h-4 w-4" />
                    Find Activities
                    {leg.activities && leg.activities.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
                            {leg.activities.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
                {activeTab === 'schedule' && (
                    <div className="space-y-8 animate-in fade-in duration-300 slide-in-from-bottom-2">
                        {leg.schedule && leg.schedule.some(s => s.activities && s.activities.length > 0) ? (
                            leg.schedule.filter(s => s.activities && s.activities.length > 0).map((day, dIdx) => (
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
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <List className="h-8 w-8 text-gray-300 mb-2" />
                                <p className="text-sm font-medium">Your itinerary is empty.</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Check "Find Activities" to add some fun!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'lodging' && (
                    <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Where to Stay</h4>
                            {isEditable && (
                                <button
                                    onClick={() => setSearchModalOpen(true)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Lodging
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
                                        legIndex={legIndex}
                                        isEditable={isEditable}
                                        canManageBooking={canManageBooking}
                                        onUpdate={() => router.refresh()}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-200">
                                <BedDouble className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">No lodging selected yet.</p>
                                {isEditable && (
                                    <button
                                        onClick={() => setSearchModalOpen(true)}
                                        className="mt-3 text-sm text-indigo-600 font-medium hover:underline"
                                    >
                                        Find a place to stay
                                    </button>
                                )}
                            </div>
                        )}

                        <LodgingSearchModal
                            isOpen={searchModalOpen}
                            onClose={() => setSearchModalOpen(false)}
                            locationName={leg.name}
                            tripId={tripId}
                            legIndex={legIndex}
                            initialStartDate={leg.start_date}
                            initialEndDate={leg.end_date}
                            onAdd={() => router.refresh()}
                        />
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Explore Activities</h4>
                        </div>
                        {leg.activities && leg.activities.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                            legIndex={legIndex}
                                            startDate={leg.start_date}
                                            endDate={leg.end_date}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-8 text-center border border-dashed border-gray-200">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">No activities planned.</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Edit the trip to add activity categories like "Museums" or "Hiking".
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
