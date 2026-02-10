'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Clock, Calendar as CalendarIcon, Check } from 'lucide-react'
import { format, addDays, parseISO, isBefore, isAfter, eachDayOfInterval } from 'date-fns'

interface ScheduledActivity {
    time: string // e.g., "08:00"
    description: string
    estimated_cost?: number
    location_name?: string
}

interface DailySchedule {
    date: string // ISO date string
    activities: ScheduledActivity[]
}

interface LegItineraryBuilderProps {
    legName: string
    startDate: string | null
    endDate: string | null
    legActivities: string[]
    initialSchedule?: DailySchedule[]
    onSave: (schedule: DailySchedule[]) => void
    onCancel: () => void
}

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour
    return {
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${displayHour}:00 ${ampm}`
    }
})

export default function LegItineraryBuilder({
    legName,
    startDate,
    endDate,
    legActivities,
    initialSchedule = [],
    onSave,
    onCancel
}: LegItineraryBuilderProps) {
    const [schedule, setSchedule] = useState<DailySchedule[]>(initialSchedule)
    const [activeDate, setActiveDate] = useState<string | null>(null)

    // Generate days when dates change
    useEffect(() => {
        if (!startDate || !endDate) return

        try {
            const start = parseISO(startDate)
            const end = parseISO(endDate)

            if (isAfter(start, end)) return

            const days = eachDayOfInterval({ start, end })
            const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'))

            setSchedule(prev => {
                const next = dayStrings.map(date => {
                    const existing = prev.find(s => s.date === date)
                    return existing || { date, activities: [] }
                })
                return next
            })

            if (!activeDate || !dayStrings.includes(activeDate)) {
                setActiveDate(dayStrings[0])
            }
        } catch (e) {
            console.error('Error generating days:', e)
        }
    }, [startDate, endDate])

    const activeSchedule = schedule.find(s => s.date === activeDate)

    const addActivity = (date: string) => {
        setSchedule(prev => prev.map(s => {
            if (s.date === date) {
                return {
                    ...s,
                    activities: [...s.activities, { time: '08:00', description: '' }]
                }
            }
            return s
        }))
    }

    const updateActivity = (date: string, index: number, updates: Partial<ScheduledActivity>) => {
        setSchedule(prev => prev.map(s => {
            if (s.date === date) {
                const nextActivities = [...s.activities]
                nextActivities[index] = { ...nextActivities[index], ...updates }
                // Sort activities by time
                nextActivities.sort((a, b) => a.time.localeCompare(b.time))
                return { ...s, activities: nextActivities }
            }
            return s
        }))
    }

    const removeActivity = (date: string, index: number) => {
        setSchedule(prev => prev.map(s => {
            if (s.date === date) {
                return {
                    ...s,
                    activities: s.activities.filter((_, i) => i !== index)
                }
            }
            return s
        }))
    }

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Daily Itinerary: {legName}</h3>
                    <p className="text-xs text-gray-500">Plan your days from 8:00 AM to Midnight</p>
                </div>
                <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Date Sidebar */}
                <div className="w-48 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
                    {schedule.map((day) => (
                        <button
                            key={day.date}
                            type="button"
                            onClick={() => setActiveDate(day.date)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${activeDate === day.date
                                ? 'bg-white border-r-4 border-r-indigo-600 text-indigo-600 font-semibold'
                                : 'hover:bg-gray-100 text-gray-600'
                                }`}
                        >
                            <div className="text-xs uppercase tracking-wider opacity-70">
                                {format(parseISO(day.date), 'EEE')}
                            </div>
                            <div className="text-sm">
                                {format(parseISO(day.date), 'MMM d')}
                            </div>
                            {day.activities.length > 0 && (
                                <div className="mt-1 flex gap-1">
                                    {day.activities.map((_, i) => (
                                        <div key={i} className="h-1 w-1 rounded-full bg-indigo-400" />
                                    ))}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Day Editor */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeDate ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                    {format(parseISO(activeDate), 'EEEE, MMMM d')}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => addActivity(activeDate)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Activity
                                </button>
                            </div>

                            <div className="space-y-4">
                                {activeSchedule?.activities.map((activity, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 group space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-32">
                                                <select
                                                    value={activity.time}
                                                    onChange={(e) => updateActivity(activeDate, idx, { time: e.target.value })}
                                                    className="block w-full rounded-md border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-1"
                                                >
                                                    {TIME_SLOTS.map(slot => (
                                                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={activity.description}
                                                    onChange={(e) => updateActivity(activeDate, idx, { description: e.target.value })}
                                                    placeholder="What are you doing? (e.g. Lunch at the Pier)"
                                                    className="block w-full border-0 border-b border-transparent bg-transparent focus:ring-0 focus:border-indigo-600 text-sm placeholder:text-gray-400 transition-all font-medium py-1"
                                                />
                                                {/* Suggestions from leg activities */}
                                                {legActivities.length > 0 && !activity.description && (
                                                    <div className="absolute top-full left-0 z-10 mt-1 w-full bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden hidden group-focus-within:block">
                                                        <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                                            From Leg Activities
                                                        </div>
                                                        {legActivities.map(act => (
                                                            <button
                                                                key={act}
                                                                type="button"
                                                                onClick={() => updateActivity(activeDate, idx, { description: act })}
                                                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                                                            >
                                                                <Check className="h-3 w-3" />
                                                                {act}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeActivity(activeDate, idx)}
                                                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4 pl-[8.5rem]">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={activity.location_name || ''}
                                                    onChange={(e) => updateActivity(activeDate, idx, { location_name: e.target.value })}
                                                    placeholder="Location name (for Google Maps)"
                                                    className="block w-full rounded-md border-gray-200 text-xs py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                />
                                            </div>
                                            <div className="w-24 relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    value={activity.estimated_cost || ''}
                                                    onChange={(e) => updateActivity(activeDate, idx, { estimated_cost: e.target.value ? Number(e.target.value) : undefined })}
                                                    placeholder="Cost / Person"
                                                    className="block w-full rounded-md border-gray-200 text-xs py-1 pl-5 pr-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {activeSchedule?.activities.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Clock className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">No activities scheduled for this day.</p>
                                        <button
                                            type="button"
                                            onClick={() => addActivity(activeDate)}
                                            className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                                        >
                                            Add something now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select a date to start planning</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => onSave(schedule)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
                >
                    <Check className="h-4 w-4" />
                    Save Schedule
                </button>
            </div>
        </div>
    )
}
