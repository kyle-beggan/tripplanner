'use client'

import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import ActivitySearchModal from '@/components/activities/ActivitySearchModal'

interface TripActivityCardProps {
    name: string
    requiresGps: boolean
    locations: string[]
}

export default function TripActivityCard({ name, requiresGps, locations }: TripActivityCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!requiresGps) {
        return (
            <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-shadow text-center h-full">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                    <MapPin className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
            </div>
        )
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full h-full flex flex-col items-center justify-center p-6 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:shadow-md transition-all text-center group"
            >
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                    <Search className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    Find {name}
                </span>
            </button>
            <ActivitySearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activityName={name}
                locations={locations}
            />
        </>
    )
}
