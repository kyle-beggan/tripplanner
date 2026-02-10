'use client'

import { useState } from 'react'
import { Calendar, Clock, BedDouble, Plus, MapPin, Search, List, Hotel, Tent } from 'lucide-react'
import { format } from 'date-fns'
import TripActivityCard from '@/components/trips/TripActivityCard'
import LodgingCard from '@/components/trips/LodgingCard'
import LodgingSearchModal from '@/components/trips/LodgingSearchModal'
import ActivitySearchModal from '@/components/activities/ActivitySearchModal'
import { useRouter } from 'next/navigation'

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

interface Lodging {
    id: string
    name: string
    address: string
    type: 'hotel' | 'airbnb' | 'other' | 'custom'
    price_level?: number
    total_cost?: number
    estimated_cost_per_person?: number
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
    const [activitySearchOpen, setActivitySearchOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

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
        <div className="relative pl-8 border-l-2 border-indigo-100 last:border-0 pb-2">
            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />

            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {leg.name}
                        <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </h3>
                    <p className="text-sm text-indigo-600 font-medium flex items-center gap-1.5 mt-1">
                        <Calendar className="h-4 w-4" />
                        {leg.start_date ? formatDate(leg.start_date, 'MMM d') : 'TBD'}
                        {leg.end_date && ` - ${formatDate(leg.end_date, 'MMM d, yyyy')}`}
                    </p>
                </div>
            </div>

            {isOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 pb-10">
                    {/* Tabs */}
                    <div className="flex p-1 mb-6 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'schedule'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            <List className="h-4 w-4" />
                            Daily Schedule
                        </button>
                        <button
                            onClick={() => setActiveTab('lodging')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'lodging'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            <Hotel className="h-4 w-4" />
                            Lodging
                            {leg.lodging && leg.lodging.length > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'lodging' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {leg.lodging.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('activities')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'activities'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            <Search className="h-4 w-4" />
                            Find Activities
                            {leg.activities && leg.activities.length > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'activities' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-600'
                                    }`}>
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
                                            {isEditable && (
                                                <button
                                                    onClick={() => setActivitySearchOpen(true)}
                                                    className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add Activity
                                                </button>
                                            )}
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
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                                                                    {item.location_name && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location_name)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-1"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <MapPin className="h-3 w-3" />
                                                                            Get Directions
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {item.estimated_cost && item.estimated_cost > 0 && (
                                                                    <div className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                                                                        ${item.estimated_cost}
                                                                    </div>
                                                                )}
                                                            </div>
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
                                            Check &quot;Find Activities&quot; to add some fun!
                                        </p>
                                        {isEditable && (
                                            <button
                                                onClick={() => setActivitySearchOpen(true)}
                                                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add an activity now
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <ActivitySearchModal
                            isOpen={activitySearchOpen}
                            onClose={() => setActivitySearchOpen(false)}
                            activityName="Attractions" // Default search term
                            locations={[leg.name]} // Default to leg location
                            enableScheduling={true}
                            tripId={tripId}
                            legIndex={legIndex}
                            initialStartDate={leg.start_date}
                            initialEndDate={leg.end_date}
                            onSchedule={() => {
                                setActivitySearchOpen(false)
                                router.refresh()
                            }}
                        />

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
                                            Edit the trip to add activity categories like &quot;Museums&quot; or &quot;Hiking&quot;.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
