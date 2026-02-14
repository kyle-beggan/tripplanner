'use client'

import { MapPin, Clock, ArrowRight, Camera, Navigation } from 'lucide-react'
import Link from 'next/link'

interface Activity {
    time: string
    description: string
    location_name?: string
}

interface LiveTripStatusProps {
    currentActivity: Activity | null
    nextActivity: Activity | null
    tripId: string
}

export default function LiveTripStatus({
    currentActivity,
    nextActivity,
    tripId
}: LiveTripStatusProps) {
    if (!currentActivity && !nextActivity) return null

    const handleNavigate = (location: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
        window.open(url, '_blank')
    }

    return (
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl overflow-hidden text-white mb-8">
            <div className="px-6 py-4 bg-white/10 backdrop-blur-md flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">Live Trip Status</span>
                </div>
                <div className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-medium">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Current Activity */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        NOW PLAYING
                    </div>
                    {currentActivity ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold leading-tight">
                                    {currentActivity.description}
                                </h3>
                                {currentActivity.location_name && (
                                    <p className="flex items-center gap-1.5 text-indigo-100 mt-1 text-sm">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {currentActivity.location_name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {currentActivity.location_name && (
                                    <button
                                        onClick={() => handleNavigate(currentActivity.location_name!)}
                                        className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        Navigate
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const photosSection = document.getElementById('photos-section')
                                        photosSection?.scrollIntoView({ behavior: 'smooth' })
                                    }}
                                    className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500/40 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                    Add Photos
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-indigo-100/60 italic text-sm">
                            No active activity right now. Time for a vibe check!
                        </div>
                    )}
                </div>

                {/* Next Up */}
                <div className="md:border-l md:border-white/10 md:pl-8 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
                        <ArrowRight className="w-3.5 h-3.5" />
                        UP NEXT
                    </div>
                    {nextActivity ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold py-0.5 px-2 bg-white/20 rounded-md">
                                    {nextActivity.time}
                                </span>
                                <h4 className="text-lg font-bold">
                                    {nextActivity.description}
                                </h4>
                            </div>
                            {nextActivity.location_name && (
                                <p className="text-sm text-indigo-100/80 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    {nextActivity.location_name}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-indigo-100/60 italic text-sm">
                            Nothing else scheduled for today. Rest up!
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
