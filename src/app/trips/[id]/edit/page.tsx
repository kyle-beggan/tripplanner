import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/get-user-profile'
import { notFound, redirect } from 'next/navigation'
import TripForm from '@/components/trips/TripForm'

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditTripPage({ params }: PageProps) {
    const { user } = await getUserProfile()
    if (!user) redirect('/login')

    const supabase = await createClient()
    const { id } = await params

    const { data: trip } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()

    if (!trip) {
        notFound()
    }

    // Verify ownership
    if (trip.owner_id !== user.id) {
        // Optionally redirect to the trip view if they aren't the owner
        redirect(`/trips/${id}`)
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">
                        Edit Trip Details
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Update information for {trip.name}.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 sm:p-8">
                <TripForm userId={user.id} trip={trip} />
            </div>
        </div>
    )
}
