'use client'

import Link from 'next/link'
import { Calendar, X, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { deleteTrip } from '@/app/trips/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import TripInviteButton from './TripInviteButton'

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
}

interface Trip {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    location?: string | null
    locations?: TripLeg[] | null
    owner_id: string
    owner_name?: string
}

interface TripCardProps {
    trip: Trip
    currentUserId: string
    isAdmin?: boolean
}

export default function TripCard({ trip, currentUserId, isAdmin }: TripCardProps) {
    const isOwner = trip.owner_id === currentUserId
    const canDelete = isOwner || isAdmin
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const router = useRouter()

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        setShowDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteTrip(trip.id)
            toast.success('Trip deleted successfully')
            router.refresh()
            setShowDeleteModal(false)
        } catch (error) {
            toast.error('Failed to delete trip')
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

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

    const checkIsLive = () => {
        if (!trip.start_date || !trip.end_date) return false
        try {
            const startStr = trip.start_date.split('T')[0]
            const endStr = trip.end_date.split('T')[0]
            const [sY, sM, sD] = startStr.split('-').map(Number)
            const [eY, eM, eD] = endStr.split('-').map(Number)
            const start = new Date(sY, sM - 1, sD)
            const end = new Date(eY, eM - 1, eD)
            end.setHours(23, 59, 59, 999)
            const now = new Date()
            return now >= start && now <= end
        } catch (e) {
            return false
        }
    }
    const isLive = checkIsLive()

    return (
        <>
            <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-200">
                {canDelete && (
                    <button
                        onClick={handleDeleteClick}
                        className="absolute top-2 right-2 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete trip"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 line-clamp-1 pr-6">{trip.name}</h3>
                            <div className="flex flex-col gap-2 mt-2">
                                {(() => {
                                    const locs = Array.isArray(trip.locations) && trip.locations.length > 0
                                        ? trip.locations
                                        : []

                                    if (locs.length === 0) return null

                                    return (
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-600 font-medium">
                                            {locs.map((leg, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-indigo-600/10">
                                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                                    <span>{typeof leg === 'string' ? leg : leg.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                                <span className="inline-flex items-center text-xs font-semibold text-gray-500">
                                    Hosted by: {trip.owner_name || '...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 flex-1 text-sm leading-6 text-gray-600 line-clamp-3">
                        {trip.description || 'No description provided.'}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {trip.start_date ? formatDate(trip.start_date) : 'TBD'}
                                {trip.end_date && ` - ${formatDate(trip.end_date)}`}
                            </span>
                        </div>
                        {isLive && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                </span>
                                LIVE NOW
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 p-4 flex gap-3">
                    <Link
                        href={`/trips/${trip.id}`}
                        className="flex-1 flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        View Trip Details
                    </Link>
                    <TripInviteButton
                        tripId={trip.id}
                        tripName={trip.name}
                        isOwnerOrAdmin={!!canDelete}
                    />
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Trip"
                message="Are you sure you want to delete this trip? This action cannot be undone and will remove all associated data."
                confirmLabel="Delete Trip"
                isDestructive={true}
                isLoading={isDeleting}
            />
        </>
    )
}
