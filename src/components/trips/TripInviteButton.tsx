'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import InviteModal from './InviteModal'

interface TripInviteButtonProps {
    tripId: string
    tripName: string
    isOwnerOrAdmin: boolean
}

export default function TripInviteButton({ tripId, tripName, isOwnerOrAdmin }: TripInviteButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (!isOwnerOrAdmin) return null

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
                <Plus className="h-4 w-4" />
                Invite
            </button>

            <InviteModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                tripId={tripId}
                tripName={tripName}
            />
        </>
    )
}
