import { getUserProfile } from '@/utils/get-user-profile'
import { redirect } from 'next/navigation'
import TripForm from '@/components/trips/TripForm'

export default async function NewTripPage() {
    const { user } = await getUserProfile()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">
                        Plan a New Trip
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Start your next adventure by filling out the details below.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 sm:p-8">
                <TripForm userId={user.id} />
            </div>
        </div>
    )
}
