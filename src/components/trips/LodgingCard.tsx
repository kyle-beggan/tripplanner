'use client'

import { MapPin, Globe, ExternalLink, Trash2, Check, Home, Star, Pencil, BedDouble, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { toggleLodgingBookingStatus, removeLodgingFromLeg, joinLodging, leaveLodging } from '@/app/trips/actions'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import LodgingEditModal from './LodgingEditModal'

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
    host_id?: string
    host_name?: string
    total_bedrooms?: number
    available_bedrooms?: number
    guest_ids?: string[]
}

interface LodgingCardProps {
    lodging: Lodging
    tripId: string
    legIndex: number
    isEditable: boolean
    canManageBooking: boolean
    currentUserId?: string
    participants?: any[]
    onUpdate?: () => void
}

export default function LodgingCard({ lodging, tripId, legIndex, isEditable, canManageBooking, currentUserId, participants, onUpdate }: LodgingCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    const handleToggleBooked = async () => {
        setIsUpdating(true)
        try {
            const result = await toggleLodgingBookingStatus(tripId, legIndex, lodging.id, !lodging.booked)
            if (result.success) {
                toast.success(lodging.booked ? 'Marked as option' : 'Marked as booked!')
                onUpdate?.()
            } else {
                toast.error(result.message || 'Failed to update status')
            }
        } catch (error) {
            toast.error('Failed to update status')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRemoveClick = () => {
        setShowDeleteModal(true)
    }

    const handleConfirmRemove = async () => {
        setIsUpdating(true)
        try {
            const result = await removeLodgingFromLeg(tripId, legIndex, lodging.id)
            if (result.success) {
                toast.success('Lodging removed')
                onUpdate?.()
            } else {
                toast.error(result.message || 'Failed to remove lodging')
            }
        } catch (error) {
            toast.error('Failed to remove lodging')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleJoin = async () => {
        if (!currentUserId) return
        setIsUpdating(true)
        try {
            const result = await joinLodging(tripId, legIndex, lodging.id)
            if (result.success) {
                toast.success('Joined lodging!')
                onUpdate?.()
            } else {
                toast.error(result.message || 'Failed to join')
            }
        } catch (error) {
            toast.error('Failed to join')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleLeave = async () => {
        if (!currentUserId) return
        setIsUpdating(true)
        try {
            const result = await leaveLodging(tripId, legIndex, lodging.id)
            if (result.success) {
                toast.success('Left lodging')
                onUpdate?.()
            } else {
                toast.error(result.message || 'Failed to leave')
            }
        } catch (error) {
            toast.error('Failed to leave')
        } finally {
            setIsUpdating(false)
        }
    }

    const isHost = currentUserId === lodging.host_id
    const isGuest = lodging.guest_ids?.includes(currentUserId || '')

    return (
        <div className={`
            relative flex flex-col p-4 rounded-xl border transition-all duration-200
            ${lodging.booked
                ? 'bg-green-50 border-green-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
        `}>
            {/* Status Badges */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                {lodging.booked && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                        Booked
                    </div>
                )}
                {isGuest && (
                    <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                        Staying Here
                    </div>
                )}
                {isHost && (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-200 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-amber-500" />
                        Host
                    </div>
                )}
            </div>

            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${lodging.type === 'airbnb' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Home className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-1" title={lodging.name}>
                            {lodging.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 uppercase">
                                Host: {isHost ? 'You' : lodging.host_name || 'Owner'}
                            </span>
                            {lodging.rating && (
                                <div className="flex items-center gap-0.5 text-yellow-600 font-medium">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    <span>{lodging.rating}</span>
                                    <span className="text-gray-400">({lodging.user_rating_count || 0})</span>
                                </div>
                            )}
                            {lodging.price_level && (
                                <span className="font-medium text-gray-600">
                                    {Array(lodging.price_level).fill('$').join('')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                <p className="text-sm text-gray-600 flex items-start gap-1.5 leading-snug">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{lodging.address}</span>
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                    {lodging.google_maps_uri && (
                        <a
                            href={lodging.google_maps_uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-md transition-colors"
                        >
                            <MapPin className="w-3 h-3" />
                            Maps
                        </a>
                    )}
                    {lodging.website_uri && (
                        <a
                            href={lodging.website_uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-md transition-colors"
                        >
                            <Globe className="w-3 h-3" />
                            Website
                        </a>
                    )}
                </div>
            </div>


            {
                (lodging.total_bedrooms !== undefined || lodging.total_cost) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {lodging.total_bedrooms !== undefined && (
                            <div className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 flex items-center gap-1">
                                <BedDouble className="w-3 h-3" />
                                {lodging.available_bedrooms} / {lodging.total_bedrooms} ROOMS LEFT
                            </div>
                        )}
                        {(lodging.guest_ids?.length || 0) > 0 && (
                            <div className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-md border border-gray-200">
                                {lodging.guest_ids?.length} JOINED
                            </div>
                        )}
                        {lodging.total_cost && (
                            <div className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-md border border-green-100">
                                ${lodging.total_cost.toLocaleString()} TOTAL
                            </div>
                        )}
                        {lodging.estimated_cost_per_person && (
                            <div className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                                ${lodging.estimated_cost_per_person}/P
                            </div>
                        )}
                    </div>
                )
            }

            {/* Guest List */}
            {((lodging.guest_ids?.length || 0) > 0) && (
                <div className="mt-3 bg-gray-50/50 rounded-lg p-2.5 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Who&apos;s staying here ({lodging.guest_ids?.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {lodging.guest_ids?.map(id => {
                            const p = participants?.find(part => (part.user_id || part.id) === id)
                            const name = p?.profile?.full_name || p?.profile?.first_name || 'Guest'
                            const isMe = id === currentUserId
                            return (
                                <span
                                    key={id}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border
                                        ${isMe ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {isMe ? 'You' : name}
                                </span>
                            )
                        })}
                    </div>
                </div>
            )}

            {
                currentUserId && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100/50">
                        {(!isHost && !isGuest && (lodging.available_bedrooms || 0) > 0) && (
                            <button
                                onClick={handleJoin}
                                disabled={isUpdating}
                                className="flex-1 text-xs font-bold py-2 px-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                Request Spot
                            </button>
                        )}
                        {isGuest && (
                            <button
                                onClick={handleLeave}
                                disabled={isUpdating}
                                className="flex-1 text-xs font-bold py-2 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-colors"
                            >
                                Leave Spot
                            </button>
                        )}
                        {(isHost || isEditable) && (
                            <>
                                {canManageBooking && (
                                    <button
                                        onClick={handleToggleBooked}
                                        disabled={isUpdating}
                                        className={`
                                        flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-colors
                                        ${lodging.booked
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}
                                    `}
                                    >
                                        {lodging.booked ? (isHost ? 'Unmark Booked' : 'Unbook') : (isHost ? 'I Booked It!' : 'Mark Booked')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    disabled={isUpdating}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                {!lodging.booked && (
                                    <button
                                        onClick={handleRemoveClick}
                                        disabled={isUpdating}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )
            }

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmRemove}
                title="Remove Lodging"
                message={`Are you sure you want to remove ${lodging.name} from the lodging options?`}
                confirmLabel="Remove"
                isDestructive={true}
                isLoading={isUpdating}
            />

            <LodgingEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                lodging={lodging}
                tripId={tripId}
                legIndex={legIndex}
                onUpdate={onUpdate}
            />
        </div >
    )
}
