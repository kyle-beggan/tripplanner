'use client'

import Link from 'next/link'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'
import { deleteTrip } from '@/app/trips/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface Trip {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    owner_id: string
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
                            {isOwner && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mt-2">
                                    Owner
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="mt-4 flex-1 text-sm leading-6 text-gray-600 line-clamp-3">
                        {trip.description || 'No description provided.'}
                    </p>

                    <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {trip.start_date ? format(new Date(trip.start_date), 'MMM d, yyyy') : 'TBD'}
                                {trip.end_date && ` - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <Link
                        href={`/trips/${trip.id}`}
                        className="flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        View Trip Details
                    </Link>
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
