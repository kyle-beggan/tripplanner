'use client'

import { Plane, Hotel, Ticket, Calculator, HelpCircle } from 'lucide-react'

interface TripCostSummaryProps {
    flightEstimate: number | null
    lodgingEstPerPerson: number
    activityEstPerPerson: number
    estimatedParticipants: number
}

export default function TripCostSummary({
    flightEstimate,
    lodgingEstPerPerson,
    activityEstPerPerson,
    estimatedParticipants
}: TripCostSummaryProps) {
    const totalEst = (flightEstimate || 0) + lodgingEstPerPerson + activityEstPerPerson

    if (totalEst === 0) {
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
                            Estimates are per person and subject to change. Lodging costs assume a full group of {estimatedParticipants} participants. The estimated price also assumes you are participating in all activities.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Plane className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Flights</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                        {flightEstimate ? `$${flightEstimate.toFixed(0)}` : 'TBD'}
                    </span>
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

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Ticket className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Activities</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                        ${activityEstPerPerson.toFixed(0)}
                    </span>
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
