'use client'

import { FeedbackComment } from '../actions'
import { formatDistanceToNow } from 'date-fns'

interface CommentListProps {
    comments: FeedbackComment[]
}

export default function CommentList({ comments }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-8">
                No comments yet. Start the discussion!
            </p>
        )
    }

    return (
        <div className="space-y-6 mb-8">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                        {comment.user?.avatar_url ? (
                            <img
                                src={comment.user.avatar_url}
                                alt=""
                                className="h-10 w-10 rounded-full bg-gray-100"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                                {comment.user?.full_name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {comment.user?.full_name || 'Anonymous'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
