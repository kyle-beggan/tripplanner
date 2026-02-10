'use client'

import { MapPin, Globe, ExternalLink, Trash2, Check, Home, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { toggleLodgingBookingStatus, removeLodgingFromLeg } from '@/app/trips/actions'

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

interface LodgingCardProps {
    lodging: Lodging
    tripId: string
    legIndex: number
    isEditable: boolean
    canManageBooking: boolean
    onUpdate?: () => void
}

export default function LodgingCard({ lodging, tripId, legIndex, isEditable, canManageBooking, onUpdate }: LodgingCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)

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

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove this lodging option?')) return

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

    return (
        <div className={`
            relative flex flex-col p-4 rounded-xl border transition-all duration-200
            ${lodging.booked
                ? 'bg-green-50 border-green-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
        `}>
            {/* Status Badge */}
            {lodging.booked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    <Check className="w-3 h-3" />
                    Booked
                </div>
            )}

            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${lodging.type === 'airbnb' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Home className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-1" title={lodging.name}>
                            {lodging.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
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
                            {lodging.total_cost && (
                                <span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">
                                    ${lodging.total_cost.toLocaleString()}
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

            {isEditable && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100/50">
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
                            {lodging.booked ? 'Mark Unbooked' : 'Mark as Booked'}
                        </button>
                    )}
                    {!lodging.booked && (
                        <button
                            onClick={handleRemove}
                            disabled={isUpdating}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
