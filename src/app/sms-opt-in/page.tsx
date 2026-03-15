'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function SMSOptInPage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [agreed, setAgreed] = useState(false)

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                setProfile(profile)
                if (profile?.text_opt_in) {
                    setAgreed(true)
                }
            }
            setLoading(false)
        }
        loadUser()
    }, [supabase])

    const handleConfirm = async () => {
        if (!user) {
            router.push('/login?redirect=/sms-opt-in')
            return
        }

        if (!agreed) {
            toast.error('You must agree to the terms to opt-in.')
            return
        }

        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({ text_opt_in: true })
            .eq('id', user.id)

        if (error) {
            toast.error(`Error: ${error.message}`)
        } else {
            toast.success('You have successfully opted-in to SMS notifications!')
            router.push('/profile')
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-10 px-4 pb-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LFG Places SMS Opt-in</h1>
            
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 md:p-8 space-y-6">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 italic text-indigo-900 text-sm">
                    &quot;By providing your mobile phone number, you consent to receive informational text messages from LFG Places related to your account activity, trip updates, and notifications. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for assistance.&quot;
                </div>

                <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                        <div className="mt-1">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-gray-900">
                                I agree to receive informational text messages from LFG Places at the number provided in my profile.
                            </p>
                            <p className="text-xs text-gray-500">
                                You can unsubscribe or manage your preferences at any time from your profile page.
                            </p>
                        </div>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
                        <button
                            onClick={handleConfirm}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {saving ? 'Confirming...' : (user ? 'Confirm SMS Opt-in' : 'Log in to Opt-in')}
                        </button>
                        
                        <Link
                            href="/profile"
                            className="flex-1 flex items-center justify-center rounded-lg bg-white border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
                        >
                            Cancel and Return to Profile
                        </Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 text-center space-y-2">
                    <p className="text-xs text-gray-400 font-medium italic">
                        By clicking &quot;Confirm&quot;, you acknowledge that you have read and agree to our 
                        <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 mx-1 underline">Terms and Conditions</Link> 
                        and 
                        <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 mx-1 underline">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    )
}
