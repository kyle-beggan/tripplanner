'use client'

import { useState, useMemo, useEffect } from 'react'
import { Calendar, Clock, BedDouble, Plus, MapPin, Search, List, Home, Tent, Pencil, Bell } from 'lucide-react'
import { format, eachDayOfInterval, parseISO, isAfter } from 'date-fns'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const TripActivityCard = dynamic(() => import('@/components/trips/TripActivityCard'), { ssr: false })
const LodgingCard = dynamic(() => import('@/components/trips/LodgingCard'), { ssr: false })
const LodgingSearchModal = dynamic(() => import('@/components/trips/LodgingSearchModal'), { ssr: false })
const AddActivityModal = dynamic(() => import('@/components/activities/AddActivityModal'), { ssr: false })
const ActivityDetailsModal = dynamic(() => import('@/components/activities/ActivityDetailsModal'), { ssr: false })
const ConfirmationModal = dynamic(() => import('@/components/ui/ConfirmationModal'), { ssr: false })

interface ScheduledActivity {
    time: string
    description: string
    estimated_cost?: number
    location_name?: string
    venmo_link?: string
    participants?: string[]
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
    userId?: string
    participants?: any[]
    dataTimestamp?: number
}

import { toggleActivityParticipation, removeActivityFromLegSchedule } from '@/app/trips/actions'
import { Check, X } from 'lucide-react'

export default function TripLegItem({
    leg,
    tripId,
    legIndex,
    isEditable,
    canManageBooking,
    activityMap,
    userId,
    participants,
    dataTimestamp
}: TripLegItemProps) {
    const router = useRouter()
    const [loadingActivity, setLoadingActivity] = useState<{ dayIdx: number, actIdx: number } | null>(null)
    const [activeTab, setActiveTab] = useState<'schedule' | 'lodging'>('schedule')
    const [searchModalOpen, setSearchModalOpen] = useState(false)
    const [activitySearchOpen, setActivitySearchOpen] = useState(false)
    const [modalInitialDate, setModalInitialDate] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(() => {
        if (!leg.start_date || !leg.end_date) return false
        const now = new Date()
        const start = parseISO(leg.start_date)
        const end = parseISO(leg.end_date)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return now >= start && now <= end
    })

    // Key: "dayIdx-actIdx", Value: string[] of participant IDs
    const [optimisticParticipants, setOptimisticParticipants] = useState<Record<string, string[]>>({})

    // Auto-scroll to today
    useEffect(() => {
        if (isOpen) {
            const todayStr = format(new Date(), 'yyyy-MM-dd')
            const element = document.getElementById(`day-${todayStr}`)
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 500) // Small delay to ensure render
            }
        }
    }, [isOpen])

    // Clear optimistic state when server data updates
    useEffect(() => {
        setOptimisticParticipants({})
    }, [dataTimestamp])

    const [activityToDelete, setActivityToDelete] = useState<{ date: string, index: number, description: string } | null>(null)
    const [isDeletingActivity, setIsDeletingActivity] = useState(false)
    const [multipliers, setMultipliers] = useState<Record<string, number>>({})
    const [editingActivity, setEditingActivity] = useState<{ date: string, index: number, data: ScheduledActivity } | null>(null)
    const [viewingActivity, setViewingActivity] = useState<{ dayDate: string, index: number, data: ScheduledActivity } | null>(null)

    const fullSchedule = useMemo(() => {
        if (!leg.start_date || !leg.end_date) return leg.schedule || []

        try {
            const start = parseISO(leg.start_date)
            const end = parseISO(leg.end_date)

            if (isAfter(start, end)) return leg.schedule || []

            const days = eachDayOfInterval({ start, end })
            const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'))

            return dayStrings.map(date => {
                const existing = leg.schedule?.find(s => s.date === date)
                return existing || { date, activities: [] }
            })
        } catch (e) {
            console.error('Error generating full schedule:', e)
            return leg.schedule || []
        }
    }, [leg.start_date, leg.end_date, leg.schedule])

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

    const handleDeleteActivity = (date: string, activityIndex: number, description: string) => {
        setActivityToDelete({ date, index: activityIndex, description })
    }

    const handleConfirmDeleteActivity = async () => {
        if (!activityToDelete) return

        setIsDeletingActivity(true)
        try {
            const result = await removeActivityFromLegSchedule(
                tripId,
                legIndex,
                activityToDelete.date,
                activityToDelete.index
            )
            if (result.success) {
                toast.success('Activity removed')
                router.refresh()
            } else {
                toast.error(result.message || 'Failed to remove activity')
            }
        } catch (error) {
            console.error('Error removing activity:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsDeletingActivity(false)
            setActivityToDelete(null)
        }
    }

    const handleOpenAddActivity = (initialDate: string | null = null) => {
        setEditingActivity(null)
        setModalInitialDate(initialDate || leg.start_date)
        setActivitySearchOpen(true)
    }

    const handleEditActivity = (date: string, index: number, data: ScheduledActivity) => {
        setEditingActivity({ date, index, data })
        setModalInitialDate(date)
        setActivitySearchOpen(true)
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
                            <Home className="h-4 w-4" />
                            Lodging
                            {leg.lodging && leg.lodging.length > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === 'lodging' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {leg.lodging.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[200px]">
                        {activeTab === 'schedule' && (
                            <div className="space-y-8 animate-in fade-in duration-300 slide-in-from-bottom-2">
                                {fullSchedule.length > 0 ? (
                                    fullSchedule.map((day, dIdx) => {
                                        const isToday = day.date.split('T')[0] === format(new Date(), 'yyyy-MM-dd')
                                        return (
                                            <div key={dIdx} id={`day-${day.date.split('T')[0]}`} className="space-y-4">
                                                <div className="flex items-center">
                                                    <h4 className={`w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm ${isToday ? 'bg-gradient-to-r from-indigo-600 to-violet-600 ring-4 ring-indigo-50' : 'bg-indigo-600'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDate(day.date, 'EEEE, MMM d')}
                                                        </div>
                                                        {isToday && (
                                                            <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-[9px] animate-pulse">
                                                                Today
                                                            </span>
                                                        )}
                                                    </h4>
                                                </div>

                                                {day.activities.length === 0 ? (
                                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                                                        <Clock className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                                                        <p className="text-xs text-gray-400">No activities scheduled for this day.</p>
                                                        {isEditable && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenAddActivity(day.date)}
                                                                className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mx-auto bg-indigo-50 px-4 py-2 rounded-full transition-colors border border-indigo-100 shadow-sm"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Add Activity
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0 relative">
                                                        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-indigo-50" />
                                                        {day.activities.map((item, iIdx) => {
                                                            const optimisticKey = `${dIdx}-${iIdx}`
                                                            const currentParticipants = optimisticParticipants[optimisticKey] !== undefined
                                                                ? optimisticParticipants[optimisticKey]
                                                                : (item.participants || [])
                                                            const isParticipating = userId && currentParticipants.includes(userId)

                                                            return (
                                                                <div key={iIdx} className="relative flex items-start gap-4 py-3 group">
                                                                    <div className="w-20 pt-1 text-[10px] font-bold text-indigo-400 text-right tabular-nums uppercase">
                                                                        {(() => {
                                                                            const [h, m] = item.time.split(':')
                                                                            const hour = parseInt(h)
                                                                            const ampm = hour >= 12 ? 'PM' : 'AM'
                                                                            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
                                                                            return `${displayHour}:${m || '00'} ${ampm}`
                                                                        })()}
                                                                    </div>
                                                                    <div className={`relative z-10 mt-1.5 w-2 h-2 rounded-full ring-4 ring-white transition-colors ${isParticipating ? 'bg-green-500' : 'bg-indigo-200 group-hover:bg-indigo-600'}`} />
                                                                    <div className={`flex-1 rounded-lg p-3 transition-colors border cursor-pointer ${isParticipating
                                                                        ? 'bg-green-50 border-green-100 hover:bg-green-100/80'
                                                                        : 'bg-gray-50 border-transparent group-hover:bg-indigo-50/50 group-hover:border-indigo-100 hover:bg-white hover:shadow-md'
                                                                        }`}
                                                                        onClick={() => setViewingActivity({
                                                                            dayDate: day.date,
                                                                            index: iIdx,
                                                                            data: item
                                                                        })}
                                                                    >
                                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
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

                                                                            <div className="flex items-center gap-3 self-end sm:self-start">
                                                                                {isEditable && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                toast.info('Reminder feature coming soon!')
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                                                            title="Send reminder"
                                                                                        >
                                                                                            <Bell className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                handleEditActivity(day.date, iIdx, item)
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                                                            title="Edit activity"
                                                                                        >
                                                                                            <Pencil className="w-4 h-4" />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation()
                                                                                                handleDeleteActivity(day.date, iIdx, item.description)
                                                                                            }}
                                                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                                                            title="Remove activity"
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                                {(() => {
                                                                                    return (
                                                                                        <>
                                                                                            {/* Participant Avatars & Count */}
                                                                                            {currentParticipants.length > 0 && participants && (
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="flex -space-x-2">
                                                                                                        {currentParticipants.slice(0, 3).map((pId) => {
                                                                                                            const p = participants.find(part => part.user_id === pId)
                                                                                                            if (!p) return null
                                                                                                            return (
                                                                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                                                                <img
                                                                                                                    key={pId}
                                                                                                                    src={p.profile?.avatar_url || `https://ui-avatars.com/api/?name=${p.profile?.full_name}&background=random`}
                                                                                                                    alt={p.profile?.full_name}
                                                                                                                    title={p.profile?.full_name}
                                                                                                                    className="h-6 w-6 rounded-full ring-2 ring-white"
                                                                                                                />
                                                                                                            )
                                                                                                        })}
                                                                                                        {currentParticipants.length > 3 && (
                                                                                                            <div className="h-6 w-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                                                                                +{currentParticipants.length - 3}
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isParticipating ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                                                        {currentParticipants.length} committed
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Cost Badge */}
                                                                                            {item.estimated_cost && item.estimated_cost > 0 && (
                                                                                                <div className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                                                                                                    ${item.estimated_cost}
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Join/Leave Button */}
                                                                                            {userId && (
                                                                                                <div className="flex items-center gap-2">
                                                                                                    {item.venmo_link && item.estimated_cost && isParticipating && (
                                                                                                        <div className="flex items-center gap-1.5 bg-indigo-50/50 p-1 rounded-full border border-indigo-100">
                                                                                                            {(() => {
                                                                                                                const key = `${dIdx}-${iIdx}`
                                                                                                                const multiplier = multipliers[key] || 1

                                                                                                                const getVenmoUrl = () => {
                                                                                                                    const phoneOrUser = item.venmo_link?.replace('@', '')
                                                                                                                    const amount = (item.estimated_cost || 0) * multiplier
                                                                                                                    const note = encodeURIComponent(`${item.description} - ${multiplier} person${multiplier > 1 ? 's' : ''}`)
                                                                                                                    return `https://venmo.com/?txn=pay&recipients=${phoneOrUser}&amount=${amount}&note=${note}`
                                                                                                                }

                                                                                                                return (
                                                                                                                    <>
                                                                                                                        <div className="flex items-center bg-white rounded-full border border-indigo-100 px-1">
                                                                                                                            <button
                                                                                                                                onClick={(e) => {
                                                                                                                                    e.stopPropagation()
                                                                                                                                    setMultipliers(prev => ({ ...prev, [key]: Math.max(1, (prev[key] || 1) - 1) }))
                                                                                                                                }}
                                                                                                                                className="w-5 h-5 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-full text-xs font-bold"
                                                                                                                            >
                                                                                                                                -
                                                                                                                            </button>
                                                                                                                            <span className="w-4 text-center text-[10px] font-bold text-indigo-600">{multiplier}</span>
                                                                                                                            <button
                                                                                                                                onClick={(e) => {
                                                                                                                                    e.stopPropagation()
                                                                                                                                    setMultipliers(prev => ({ ...prev, [key]: (prev[key] || 1) + 1 }))
                                                                                                                                }}
                                                                                                                                className="w-5 h-5 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-full text-xs font-bold"
                                                                                                                            >
                                                                                                                                +
                                                                                                                            </button>
                                                                                                                        </div>
                                                                                                                        <a
                                                                                                                            href={getVenmoUrl()}
                                                                                                                            target="_blank"
                                                                                                                            rel="noopener noreferrer"
                                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#3396cd] hover:bg-[#2b7fad] text-white rounded-full text-xs font-medium transition-colors shadow-sm"
                                                                                                                        >
                                                                                                                            Pay ${((item.estimated_cost || 0) * multiplier).toFixed(2)}
                                                                                                                        </a>
                                                                                                                    </>
                                                                                                                )
                                                                                                            })()}
                                                                                                        </div>
                                                                                                    )}

                                                                                                    <button
                                                                                                        onClick={async (e) => {
                                                                                                            e.stopPropagation()

                                                                                                            // Optimistic update
                                                                                                            let newParticipants = [...currentParticipants]
                                                                                                            if (isParticipating) {
                                                                                                                newParticipants = newParticipants.filter(id => id !== userId)
                                                                                                            } else {
                                                                                                                newParticipants.push(userId)
                                                                                                            }

                                                                                                            setOptimisticParticipants(prev => ({
                                                                                                                ...prev,
                                                                                                                [optimisticKey]: newParticipants
                                                                                                            }))

                                                                                                            // Prevent duplicate requests if already loading (though visual feedback is instant now)
                                                                                                            if (loadingActivity) return
                                                                                                            setLoadingActivity({ dayIdx: dIdx, actIdx: iIdx })

                                                                                                            try {
                                                                                                                await toggleActivityParticipation(tripId, legIndex, day.date, iIdx)
                                                                                                                router.refresh()
                                                                                                            } catch (error) {
                                                                                                                console.error('Failed to toggle participation', error)
                                                                                                                toast.error('Failed to update participation')
                                                                                                                // Revert optimistic update on error
                                                                                                                setOptimisticParticipants(prev => {
                                                                                                                    const copy = { ...prev }
                                                                                                                    delete copy[optimisticKey]
                                                                                                                    return copy
                                                                                                                })
                                                                                                            } finally {
                                                                                                                setLoadingActivity(null)
                                                                                                            }
                                                                                                        }}
                                                                                                        disabled={!!loadingActivity}
                                                                                                        className={`
                                                                                                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                                                                                                        ${isParticipating
                                                                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                                                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                                                                            }
                                                                                                        ${loadingActivity?.dayIdx === dIdx && loadingActivity?.actIdx === iIdx ? 'cursor-wait' : ''}
                                                                                                    `}
                                                                                                    >
                                                                                                        {isParticipating ? (
                                                                                                            <>
                                                                                                                <Check className="w-3 h-3" />
                                                                                                                Going
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <Plus className="w-3 h-3" />
                                                                                                                Join
                                                                                                            </>
                                                                                                        )}
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </>
                                                                                    )
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        {isEditable && (
                                                            <div className="flex justify-center pt-2">
                                                                <button
                                                                    onClick={() => handleOpenAddActivity(day.date)}
                                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-full transition-colors border border-indigo-100 shadow-sm"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Add Activity
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <List className="h-8 w-8 text-gray-300 mb-2" />
                                        <p className="text-sm font-medium">Your itinerary is empty.</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Check &quot;Find Activities&quot; to add some fun!
                                        </p>
                                        {isEditable && (
                                            <button
                                                onClick={() => handleOpenAddActivity(leg.start_date)}
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

                        <AddActivityModal
                            isOpen={activitySearchOpen}
                            onClose={() => {
                                setActivitySearchOpen(false)
                                setEditingActivity(null)
                            }}
                            tripId={tripId}
                            legIndex={legIndex}
                            startDate={leg.start_date}
                            endDate={leg.end_date}
                            locationName={leg.name}
                            availableActivities={Array.from(activityMap.values())}
                            initialDate={modalInitialDate || leg.start_date}
                            initialActivityData={editingActivity ? {
                                index: editingActivity.index,
                                time: editingActivity.data.time,
                                description: editingActivity.data.description,
                                estimated_cost: editingActivity.data.estimated_cost,
                                venmo_link: editingActivity.data.venmo_link,
                                location_name: editingActivity.data.location_name
                            } : null}
                        />

                        <ConfirmationModal
                            isOpen={!!activityToDelete}
                            onClose={() => setActivityToDelete(null)}
                            onConfirm={handleConfirmDeleteActivity}
                            title="Remove Activity"
                            message={`Are you sure you want to remove "${activityToDelete?.description}" from the schedule?`}
                            confirmLabel="Remove"
                            isDestructive={true}
                            isLoading={isDeletingActivity}
                        />

                        {viewingActivity && (() => {
                            const day = fullSchedule.find(d => d.date === viewingActivity.dayDate)
                            const liveActivity = day?.activities[viewingActivity.index]
                            if (!liveActivity) return null

                            return (
                                <ActivityDetailsModal
                                    isOpen={!!viewingActivity}
                                    onClose={() => setViewingActivity(null)}
                                    tripId={tripId}
                                    legIndex={legIndex}
                                    date={viewingActivity.dayDate}
                                    activityIndex={viewingActivity.index}
                                    activity={liveActivity}
                                    participants={participants || []}
                                    userId={userId}
                                />
                            )
                        })()}
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

                    </div>
                </div>
            )}
        </div>
    )
}
