'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateFeedbackModal from './CreateFeedbackModal'

export default function CreateFeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Submit Feedback
            </button>

            <CreateFeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}
