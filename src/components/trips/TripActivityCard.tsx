'use client'

import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import ActivitySearchModal from '@/components/activities/ActivitySearchModal'

interface TripActivityCardProps {
    name: string
    requiresGps: boolean
    locations: string[]
    tripId?: string
    isEditable?: boolean
    legIndex?: number
    startDate?: string | null
    endDate?: string | null
}

export default function TripActivityCard({
    name,
    requiresGps,
    locations,
    tripId,
    isEditable,
    legIndex,
    startDate,
    endDate
}: TripActivityCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!requiresGps) {
        return (
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:shadow-sm transition-shadow h-full">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-900 leading-tight text-left">{name}</span>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-full flex items-center gap-3 p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:shadow-md transition-all text-left group"
            >
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Search className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-900 group-hover:text-indigo-700 transition-colors leading-tight">
                    Find {name}
                </span>
            </button>
            <ActivitySearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activityName={name}
                locations={locations}
                tripId={tripId}
                isEditable={isEditable}
                legIndex={legIndex}
                startDate={startDate}
                endDate={endDate}
            />
        </>
    )
}
