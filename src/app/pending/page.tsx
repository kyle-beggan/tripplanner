'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function PendingPage() {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Account Pending</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
                Your account has been created and is currently awaiting administrator approval.
                You will be able to access the application once an admin reviews your request.
            </p>
            <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <LogOut className="h-4 w-4" />
                Sign Out
            </button>
        </div>
    )
}
