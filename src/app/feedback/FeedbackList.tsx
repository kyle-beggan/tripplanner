'use client'

import { useState } from 'react'
import { Feedback, deleteFeedback } from './actions'
import Link from 'next/link'
import { MessageSquare, Bug, Lightbulb, CheckCircle, Clock, Circle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { toast } from 'sonner'

interface FeedbackListProps {
    initialFeedback: Feedback[]
    currentUser: {
        id: string
        isAdmin: boolean
    } | null
}

export default function FeedbackList({ initialFeedback, currentUser }: FeedbackListProps) {
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, feedbackId: string | null }>({
        isOpen: false,
        feedbackId: null
    })
    const [isDeleting, setIsDeleting] = useState(false)

    const filteredFeedback = initialFeedback.filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        return true
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'closed': return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
            default: return <Circle className="h-4 w-4 text-gray-400" />
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <Bug className="h-4 w-4 text-red-500" />
            case 'feature_request': return <Lightbulb className="h-4 w-4 text-amber-500" />
            default: return <MessageSquare className="h-4 w-4 text-blue-500" />
        }
    }

    const getStatusText = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    const getTypeText = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    const handleDeleteClick = (e: React.MouseEvent, feedbackId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setDeleteConfirmation({ isOpen: true, feedbackId })
    }

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.feedbackId) return

        setIsDeleting(true)
        try {
            const result = await deleteFeedback(deleteConfirmation.feedbackId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Feedback deleted successfully')
            }
        } catch (error) {
            toast.error('An error occurred while deleting feedback')
        } finally {
            setIsDeleting(false)
            setDeleteConfirmation({ isOpen: false, feedbackId: null })
        }
    }

    return (
        <div>
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, feedbackId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Feedback"
                message="Are you sure you want to delete this feedback? This action cannot be undone."
                confirmLabel="Delete"
                isDestructive={true}
                isLoading={isDeleting}
            />
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    aria-label="Filter by status"
                >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    aria-label="Filter by type"
                >
                    <option value="all">All Types</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="general">General Feedback</option>
                </select>
            </div>

            {filteredFeedback.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No feedback found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {initialFeedback.length === 0 ? "Be the first to share your thoughts!" : "Try adjusting your filters."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFeedback.map((item) => (
                        <Link
                            key={item.id}
                            href={`/feedback/${item.id}`}
                            className="block p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        {getTypeIcon(item.type)}
                                        <span className="ml-1">{getTypeText(item.type)}</span>
                                    </span>
                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                        {getStatusIcon(item.status)}
                                        <span className="ml-1">{getStatusText(item.status)}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>

                                    {currentUser && (currentUser.isAdmin || currentUser.id === item.user_id) && (
                                        <button
                                            onClick={(e) => handleDeleteClick(e, item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            aria-label="Delete feedback"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {item.title}
                            </h3>

                            <p className="text-sm text-gray-600 line-clamp-3 mb-4 h-[60px]">
                                {item.description}
                            </p>

                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                                {item.user?.avatar_url ? (
                                    <img
                                        src={item.user.avatar_url}
                                        alt=""
                                        className="h-6 w-6 rounded-full bg-gray-100"
                                    />
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {item.user?.full_name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <span className="text-xs text-gray-500">
                                    {item.user?.full_name || 'Anonymous'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
