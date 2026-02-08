
import { getFeedbackDetail } from '../actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Bug, Lightbulb, CheckCircle, Clock, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import CommentList from './CommentList'
import CommentForm from './CommentForm'
import StatusSelect from './StatusSelect'
import { createClient } from '@/utils/supabase/server'

interface PageProps {
    params: {
        id: string
    }
}

export default async function FeedbackDetailPage({ params }: PageProps) {
    const { id } = await params
    const result = await getFeedbackDetail(id)

    if (!result) {
        notFound()
    }

    const { feedback, comments } = result
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // check if admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'closed': return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'in_progress': return <Clock className="h-5 w-5 text-yellow-500" />
            default: return <Circle className="h-5 w-5 text-gray-400" />
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <Bug className="h-5 w-5 text-red-500" />
            case 'feature_request': return <Lightbulb className="h-5 w-5 text-amber-500" />
            default: return <MessageSquare className="h-5 w-5 text-blue-500" />
        }
    }

    const getStatusText = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    const getTypeText = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/feedback" className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transaction-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Feedback
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/20">
                                {getTypeIcon(feedback.type)}
                                <span className="ml-2">{getTypeText(feedback.type)}</span>
                            </span>
                            {isAdmin ? (
                                <StatusSelect feedbackId={feedback.id} currentStatus={feedback.status} />
                            ) : (
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-400/20">
                                    {getStatusIcon(feedback.status)}
                                    <span className="ml-2">{getStatusText(feedback.status)}</span>
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {feedback.title}
                    </h1>

                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <p className="whitespace-pre-wrap">{feedback.description}</p>
                    </div>

                    <div className="flex items-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            {feedback.user?.avatar_url ? (
                                <img
                                    src={feedback.user.avatar_url}
                                    alt=""
                                    className="h-10 w-10 rounded-full bg-gray-100"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                                    {feedback.user?.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {feedback.user?.full_name || 'Anonymous'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Original Poster
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments ({comments.length})
                    </h2>

                    <CommentList comments={comments} />

                    <div className="mt-8">
                        <CommentForm feedbackId={feedback.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
