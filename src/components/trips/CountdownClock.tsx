'use client'

import { useState, useEffect } from 'react'
import { Timer, CalendarDays } from 'lucide-react'

interface CountdownClockProps {
    startDate: string
    isCompact?: boolean
}

export default function CountdownClock({ startDate, isCompact }: CountdownClockProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
    } | null>(null)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const start = new Date(startDate).getTime()
            const now = new Date().getTime()
            const difference = start - now

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                })
            } else {
                setTimeLeft(null)
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(timer)
    }, [startDate])

    if (!timeLeft) return null

    if (isCompact) {
        return (
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                    <Timer className="w-3 h-3 animate-pulse" />
                    Trip Countdown
                </div>

                <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
                    <CompactUnit value={timeLeft.days} label="Days" />
                    <CompactUnit value={timeLeft.hours} label="Hrs" />
                    <CompactUnit value={timeLeft.minutes} label="Min" />
                    <CompactUnit value={timeLeft.seconds} label="Sec" />
                </div>
            </div>
        )
    }

    return (
        <section className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden group">
            {/* Background decorative elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-colors duration-700" />

            <div className="relative flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-[0.2em] text-xs">
                    <Timer className="w-4 h-4 animate-pulse" />
                    Trip Countdown
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl">
                    <CountdownUnit value={timeLeft.days} label="Days" />
                    <CountdownUnit value={timeLeft.hours} label="Hours" />
                    <CountdownUnit value={timeLeft.minutes} label="Minutes" />
                    <CountdownUnit value={timeLeft.seconds} label="Seconds" />
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium pt-2">
                    <CalendarDays className="w-4 h-4" />
                    Departs {new Date(startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </div>
        </section>
    )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square md:aspect-auto md:h-24 flex items-center justify-center bg-white rounded-2xl shadow-lg border border-gray-100 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-5xl font-black text-gray-900 tabular-nums relative z-10">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    )
}

function CompactUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-full py-2 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xl font-bold text-indigo-600 tabular-nums">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="mt-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
        </div>
    )
}
