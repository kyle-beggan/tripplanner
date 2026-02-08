import Link from 'next/link'
import { Calendar, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'

interface Trip {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
    owner_id: string
}

export default function TripCard({ trip, currentUserId }: { trip: Trip, currentUserId: string }) {
    const isOwner = trip.owner_id === currentUserId

    return (
        <div className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-1">{trip.name}</h3>
                        {isOwner && (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/20 mt-2">
                                Owner
                            </span>
                        )}
                    </div>
                </div>

                <p className="mt-4 flex-1 text-sm leading-6 text-gray-600 dark:text-gray-300 line-clamp-3">
                    {trip.description || 'No description provided.'}
                </p>

                <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {trip.start_date ? format(new Date(trip.start_date), 'MMM d, yyyy') : 'TBD'}
                            {trip.end_date && ` - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                <Link
                    href={`/trips/${trip.id}`}
                    className="flex w-full items-center justify-center rounded-lg bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    View Trip Details
                </Link>
            </div>
        </div>
    )
}
