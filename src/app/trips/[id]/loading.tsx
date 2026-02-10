import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900">Gathering Trip Details...</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                    We&apos;re fetching the latest itinerary, flight estimates, and activity details for your trip.
                </p>
            </div>
        </div>
    )
}
