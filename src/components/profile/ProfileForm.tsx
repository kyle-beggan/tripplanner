'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import AvatarUpload from './AvatarUpload'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileForm({ user, profile }: { user: any, profile: any }) {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const [firstName, setFirstName] = useState(profile?.first_name || '')
    const [lastName, setLastName] = useState(profile?.last_name || '')
    const [username, setUsername] = useState(profile?.username || '')
    const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || '')

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const updates = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            username,
            phone_number: phoneNumber,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) {
            const msg = `Error: ${error.message}`
            setMessage(msg)
            console.error(error)
            toast.error(msg)
        } else {
            setMessage(null)
            toast.success('Profile updated successfully!')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Avatar Section */}
            <div className="flex justify-center pb-6 border-b border-gray-100">
                <AvatarUpload
                    uid={user.id}
                    url={avatarUrl}
                    onUpload={(url) => {
                        setAvatarUrl(url)
                        // Optional: Auto-save avatar change immediately? 
                        // For now, let's keep it as part of the form submission for clarity
                    }}
                />
            </div>

            <form onSubmit={updateProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="first_name"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="last_name"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            Email Address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                type="email"
                                disabled
                                value={user.email}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50 sm:text-sm sm:leading-6 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2">
                            <input
                                type="tel"
                                id="phone"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-md text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    )
}
