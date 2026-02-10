'use client'

import { useState } from 'react'
import { Plane, Hotel, Ticket, Calculator, HelpCircle } from 'lucide-react'
import { updateParticipantIsFlying } from '@/app/trips/actions'
import { useRouter } from 'next/navigation'

interface TripCostSummaryProps {
    tripId: string
    flightEstimate: number | null
    lodgingEstPerPerson: number
    activityEstPerPerson: number
    myActivityCost?: number
    estimatedParticipants: number
    initialIsFlying?: boolean
}

export default function TripCostSummary({
    tripId,
    flightEstimate,
    lodgingEstPerPerson,
    activityEstPerPerson,
    myActivityCost,
    estimatedParticipants,
    initialIsFlying = true
}: TripCostSummaryProps) {
    const router = useRouter()
    const [isFlying, setIsFlying] = useState(initialIsFlying)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleFlightToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        setIsFlying(checked)
        setIsUpdating(true)
        try {
            await updateParticipantIsFlying(tripId, checked)
            router.refresh()
        } catch (error) {
            console.error('Failed to update flight status', error)
            // Revert on failure
            setIsFlying(!checked)
        } finally {
            setIsUpdating(false)
        }
    }

    const effectiveActivityCost = myActivityCost !== undefined ? myActivityCost : activityEstPerPerson

    // Only include flight cost if user is flying
    const applicableFlightCost = isFlying ? (flightEstimate || 0) : 0
    const totalEst = applicableFlightCost + lodgingEstPerPerson + effectiveActivityCost

    if (totalEst === 0 && !flightEstimate && lodgingEstPerPerson === 0 && effectiveActivityCost === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-indigo-600" />
                    Estimated Cost Per Person
                </h3>
                <div className="group relative">
                    <HelpCircle className="h-5 w-5 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        <p>
                            Estimates are per person and subject to change. Lodging costs assume a full group of {estimatedParticipants} participants.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className={`flex flex-col p-3 rounded-lg transition-colors ${isFlying ? 'bg-gray-50' : 'bg-gray-100 opacity-75'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isFlying ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Plane className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Flights</span>
                        </div>
                        <span className={`text-sm font-bold ${isFlying ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                            {flightEstimate ? `$${flightEstimate.toFixed(0)}` : 'TBD'}
                        </span>
                    </div>
                    {/* Toggle Switch */}
                    <label className="flex items-center gap-2 cursor-pointer mt-1 ml-11">
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isFlying}
                                onChange={handleFlightToggle}
                                disabled={isUpdating}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-xs text-gray-500">I am flying</span>
                    </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Hotel className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Lodging</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                        ${lodgingEstPerPerson.toFixed(0)}
                    </span>
                </div>

                <div className="flex flex-col p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <Ticket className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Activities</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                            {myActivityCost !== undefined && myActivityCost !== activityEstPerPerson ? (
                                <span className="flex flex-col items-end">
                                    <span>${effectiveActivityCost.toFixed(0)}</span>
                                    <span className="text-[10px] text-gray-400 font-normal">of ${activityEstPerPerson.toFixed(0)} total</span>
                                </span>
                            ) : (
                                <span>${effectiveActivityCost.toFixed(0)}</span>
                            )}
                        </span>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">Total Estimate</span>
                    <span className="text-xl font-bold text-indigo-600">
                        ${totalEst.toFixed(0)}
                    </span>
                </div>

            </div>
        </div>
    )
}
