'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching users:', error)
        return []
    }

    return profiles
}

export async function updateUserStatus(userId: string, status: 'approved' | 'rejected', role: 'user' | 'admin' = 'user') {
    const supabase = await createClient()

    // Verify requesting user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const updateData: any = { status }
    if (role) updateData.role = role

    const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()

    if (error) {
        console.error('Database update error:', error)
        return { error: error.message }
    }

    if (!data || data.length === 0) {
        console.warn('No rows updated for user:', userId)
        return { error: 'User not found or no changes applied' }
    }

    // Send approval email if status changed to approved
    if (status === 'approved') {
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey) {
            try {
                const { Resend } = await import('resend')
                const { headers } = await import('next/headers')
                const resend = new Resend(resendApiKey)

                // Dynamically determine the base URL
                let baseUrl = process.env.NEXT_PUBLIC_APP_URL
                if (!baseUrl) {
                    const host = (await headers()).get('host')
                    const protocol = host?.includes('localhost') ? 'http' : 'https'
                    baseUrl = host ? `${protocol}://${host}` : 'https://lfgplaces.com'
                }

                const approvedUser = data[0]
                if (approvedUser.email) {
                    await resend.emails.send({
                        from: 'LFG Places <notifications@lfgplaces.com>',
                        to: approvedUser.email,
                        subject: 'Your account has been approved!',
                        html: `
                            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; color: #1f2937;">
                                <div style="text-align: center; margin-bottom: 32px;">
                                    <h1 style="color: #4f46e5; font-size: 28px; font-weight: 800; margin: 0;">LFG Places</h1>
                                </div>
                                
                                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; border-radius: 16px; color: #ffffff; margin-bottom: 24px;">
                                    <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Welcome to LFG Places!</h2>
                                    <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.96;">
                                        Great news! Your account has been approved. You can now log in and start planning your next trip.
                                    </p>
                                </div>
                                
                                <div style="text-align: center; margin-top: 32px;">
                                    <a href="${baseUrl}" 
                                       style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                                        Log In Now
                                    </a>
                                </div>
                            </div>
                        `
                    })
                }
            } catch (err) {
                console.error('Error sending approval email:', err)
            }
        }
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // Verify requesting user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
}
