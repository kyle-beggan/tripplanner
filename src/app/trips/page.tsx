import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/get-user-profile'
import TripCard from '@/components/trips/TripCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MyTripsPage() {
    const { user, profile } = await getUserProfile()
    const supabase = await createClient()

    if (!user) return null

    // Call the RPC function we just created
    const { data: trips, error } = await supabase.rpc('get_user_trips', {
        query_user_id: user.id
    })

    if (error) {
        console.error('Error fetching trips:', error)
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Trips</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage the trips you're organizing or attending.
                    </p>
                </div>
                {/* Temporary Create Button - User didn't filter this out but it's essential */}
                <Link
                    href="/trips/new"
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <Plus className="h-4 w-4" />
                    Plan a Trip
                </Link>
            </div>

            {!trips || trips.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No trips found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new adventure.</p>
                    <div className="mt-6">
                        <Link
                            href="/trips/new"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            New Trip
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {trips.map((trip: any) => (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            currentUserId={user.id}
                            isAdmin={profile?.role === 'admin'}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
