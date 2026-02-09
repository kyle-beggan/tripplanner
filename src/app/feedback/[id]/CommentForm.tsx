'use client'

import { useState } from 'react'
import { createComment } from '../actions'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CommentForm({ feedbackId }: { feedbackId: string }) {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsSubmitting(true)
        const result = await createComment(feedbackId, content)

        if (result.error) {
            toast.error(result.error)
        } else {
            setContent('')
            toast.success('Comment posted')
        }
        setIsSubmitting(false)
    }

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <label htmlFor="comment" className="sr-only">
                    Add your comment
                </label>
                <textarea
                    rows={3}
                    name="comment"
                    id="comment"
                    className="block w-full resize-none border-0 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Add to the discussion..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex items-center justify-between py-2 pl-3 pr-2 bg-gray-50 border-t border-gray-200">
                    <div className="flex-shrink-0">
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Post Comment
                                    <Send className="ml-2 h-3 w-3" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
