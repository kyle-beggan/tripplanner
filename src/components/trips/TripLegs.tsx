import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import TripLegItem from './TripLegItem'

interface ScheduledActivity {
    time: string
    description: string
}

interface DailySchedule {
    date: string
    activities: ScheduledActivity[]
}

interface Lodging {
    id: string
    name: string
    address: string
    type: 'hotel' | 'airbnb' | 'other' | 'custom'
    price_level?: number
    total_cost?: number
    rating?: number
    user_rating_count?: number
    google_maps_uri?: string
    website_uri?: string
    booked: boolean
}

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
    schedule?: DailySchedule[]
    lodging?: Lodging[]
}

interface TripLegsProps {
    legs: TripLeg[]
    tripId: string
    isEditable: boolean
    canManageBooking: boolean
    activityMap: Map<string, any>
}

export default function TripLegs({ legs, tripId, isEditable, canManageBooking, activityMap }: TripLegsProps) {
    if (legs.length === 0) {
        return <p className="text-gray-500 italic">No locations added to this trip yet.</p>
    }

    return (
        <div className="space-y-12">
            {legs.map((leg, index) => (
                <TripLegItem
                    key={index}
                    leg={leg}
                    tripId={tripId}
                    legIndex={index}
                    isEditable={isEditable}
                    canManageBooking={canManageBooking}
                    activityMap={activityMap}
                />
            ))}
        </div>
    )
}
