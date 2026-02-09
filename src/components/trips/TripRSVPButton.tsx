'use client'

import { useState } from 'react'
import TripRSVPModal from './TripRSVPModal'

interface TripRSVPButtonProps {
    trip: any
    initialData?: any
}

export default function TripRSVPButton({ trip, initialData }: TripRSVPButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const status = initialData?.status

    return (
        <>
            <TripRSVPModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                trip={trip}
                initialData={initialData}
            />

            {status === 'going' ? (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    Edit RSVP
                </button>
            ) : status === 'declined' ? (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    Edit RSVP
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    RSVP
                </button>
            )}
        </>
    )
}
