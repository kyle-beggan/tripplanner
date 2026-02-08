
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type FeedbackType = 'bug' | 'feature_request' | 'general'
export type FeedbackStatus = 'open' | 'in_progress' | 'closed'

export interface Feedback {
    id: string
    user_id: string
    title: string
    description: string
    type: FeedbackType
    status: FeedbackStatus
    created_at: string
    user?: {
        full_name: string
        avatar_url: string
    }
}

export interface FeedbackComment {
    id: string
    feedback_id: string
    user_id: string
    content: string
    created_at: string
    user?: {
        full_name: string
        avatar_url: string
    }
}

export async function getFeedbackList() {
    const supabase = await createClient()

    const { data: feedback, error } = await supabase
        .from('feedback')
        .select(`
            *,
            user:profiles!feedback_user_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching feedback:', JSON.stringify(error, null, 2))
        return []
    }

    return feedback as Feedback[]
}

export async function getFeedbackDetail(id: string) {
    const supabase = await createClient()

    const { data: feedback, error } = await supabase
        .from('feedback')
        .select(`
            *,
            user:profiles!feedback_user_id_fkey(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching feedback detail:', error)
        return null
    }

    // Fetch comments
    const { data: comments, error: commentsError } = await supabase
        .from('feedback_comments')
        .select(`
            *,
            user:profiles!feedback_comments_user_id_fkey(full_name, avatar_url)
        `)
        .eq('feedback_id', id)
        .order('created_at', { ascending: true })

    if (commentsError) {
        console.error('Error fetching comments:', commentsError)
    }

    return {
        feedback: feedback as Feedback,
        comments: (comments || []) as FeedbackComment[]
    }
}

export async function createFeedback(title: string, description: string, type: FeedbackType) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to submit feedback' }
    }

    const { error } = await supabase
        .from('feedback')
        .insert({
            user_id: user.id,
            title,
            description,
            type
        })

    if (error) {
        console.error('Error creating feedback:', error)
        return { error: 'Failed to submit feedback' }
    }

    revalidatePath('/feedback')
    return { success: true }
}

export async function createComment(feedbackId: string, content: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to comment' }
    }

    const { error } = await supabase
        .from('feedback_comments')
        .insert({
            feedback_id: feedbackId,
            user_id: user.id,
            content
        })

    if (error) {
        console.error('Error creating comment:', error)
        return { error: 'Failed to post comment' }
    }

    revalidatePath(`/feedback/${feedbackId}`)
    return { success: true }
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const supabase = await createClient()

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // RLS will handle the permission check, but good to be explicit/fail fast
    // Ideally we check profile role here or rely on RLS throwing/returning 0 rows updated

    const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Error updating status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/feedback')
    revalidatePath(`/feedback/${id}`)
    return { success: true }
}
