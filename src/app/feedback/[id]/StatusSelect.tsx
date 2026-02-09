'use client'

import { useState } from 'react'
import { updateFeedbackStatus, FeedbackStatus } from '../actions'
import { toast } from 'sonner'
import { CheckCircle, Clock, Circle } from 'lucide-react'

interface StatusSelectProps {
    feedbackId: string
    currentStatus: FeedbackStatus
}

export default function StatusSelect({ feedbackId, currentStatus }: StatusSelectProps) {
    const [status, setStatus] = useState<FeedbackStatus>(currentStatus)
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusChange = async (newStatus: FeedbackStatus) => {
        setIsLoading(true)
        const result = await updateFeedbackStatus(feedbackId, newStatus)

        if (result.error) {
            toast.error(result.error)
            setStatus(currentStatus) // revert
        } else {
            setStatus(newStatus)
            toast.success('Status updated')
        }
        setIsLoading(false)
    }

    const getStatusIcon = (s: FeedbackStatus) => {
        switch (s) {
            case 'closed': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
            default: return <Circle className="h-4 w-4 text-gray-400" />
        }
    }

    return (
        <div className="relative inline-block text-left">
            <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
                disabled={isLoading}
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-pointer"
            >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
            </select>
            {isLoading && (
                <div className="absolute inset-y-0 right-8 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
                </div>
            )}
        </div>
    )
}
