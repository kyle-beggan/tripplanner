'use client'

import { useState } from 'react'
import { Check, CheckCheck, Loader2, Plus, X } from 'lucide-react'
import { joinAllTripActivities, unjoinAllTripActivities } from '@/app/trips/actions'
import { useRouter } from 'next/navigation'

interface TripJoinAllButtonProps {
    tripId: string
    joinedCount: number
    totalCount: number
}

export default function TripJoinAllButton({ tripId, joinedCount, totalCount }: TripJoinAllButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleJoinAll = async () => {
        if (loading) return
        setLoading(true)
        try {
            const result = await joinAllTripActivities(tripId)
            if (result.success) {
                router.refresh()
            } else {
                alert('Failed to join all activities')
            }
        } catch (error) {
            console.error('Error joining all:', error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleUnjoinAll = async () => {
        if (loading) return
        setLoading(true)
        try {
            const result = await unjoinAllTripActivities(tripId)
            if (result.success) {
                router.refresh()
            } else {
                alert('Failed to unjoin all activities')
            }
        } catch (error) {
            console.error('Error unjoining all:', error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const isFullyJoined = totalCount > 0 && joinedCount === totalCount
    const hasJoinedAny = joinedCount > 0

    return (
        <div className="flex items-center gap-2">
            {!isFullyJoined && (
                <button
                    onClick={handleJoinAll}
                    disabled={loading}
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                        bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:scale-95
                        ${loading ? 'opacity-70 cursor-wait' : ''}
                    `}
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Plus className="w-3.5 h-3.5" />
                    )}
                    {joinedCount > 0 ? 'Join Remaining' : 'Join All Activities'}
                </button>
            )}

            {hasJoinedAny && (
                <button
                    onClick={handleUnjoinAll}
                    disabled={loading}
                    className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all
                        ${isFullyJoined
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                        }
                        ${loading ? 'opacity-70 cursor-wait' : ''}
                    `}
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <X className="w-3.5 h-3.5" />
                    )}
                    {isFullyJoined ? 'Leave All Activities' : 'Leave All'}
                </button>
            )}
        </div>
    )
}
