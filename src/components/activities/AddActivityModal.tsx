'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Search, Plus, Calendar, Clock, MapPin, DollarSign, Loader2, Navigation, Check } from 'lucide-react'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { addActivityToLegSchedule, updateActivityInLegSchedule, createNewActivityCategory } from '@/app/trips/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Activity {
    name: string
    requires_gps?: boolean
}

interface Place {
    id: string
    displayName: { text: string }
    formattedAddress: string
    googleMapsUri?: string
}

interface AddActivityModalProps {
    isOpen: boolean
    onClose: () => void
    tripId?: string
    legIndex?: number
    startDate?: string | null
    endDate?: string | null
    availableActivities: Activity[]
    onAdd?: (activity: any) => void // For client-side only (TripForm)
    initialDate?: string | null
    initialTab?: 'custom' | 'find'
    initialCategory?: string
    locationName?: string
    initialActivityData?: {
        index: number
        time: string
        description: string
        estimated_cost?: number
        venmo_link?: string
        location_name?: string
    } | null
}

export default function AddActivityModal({
    isOpen,
    onClose,
    tripId,
    legIndex,
    startDate,
    endDate,
    availableActivities,
    onAdd,
    initialDate,
    initialTab = 'custom',
    initialCategory,
    locationName,
    initialActivityData
}: AddActivityModalProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'custom' | 'find'>(initialTab)
    const [subView, setSubView] = useState<'categories' | 'search' | 'schedule' | 'create_category'>('categories')

    // Custom Form State
    const [customTitle, setCustomTitle] = useState('')
    const [customLocation, setCustomLocation] = useState('')
    const [customDate, setCustomDate] = useState('')
    const [customTime, setCustomTime] = useState('12:00')
    const [customCost, setCustomCost] = useState('')
    const [customVenmoLink, setCustomVenmoLink] = useState('')

    // Find Activities State
    const [selectedCategory, setSelectedCategory] = useState<Activity | null>(null)
    const [places, setPlaces] = useState<Place[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // New Category Form State
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryRequiresGps, setNewCategoryRequiresGps] = useState(true)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    const handleSearch = useCallback(async (category: string) => {
        setLoading(true)
        setSubView('search')
        try {
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: category,
                    location: locationName || 'nearby'
                }),
            })
            const data = await response.json()
            setPlaces(data.places || [])
        } catch (err) {
            toast.error('Failed to search for places')
        } finally {
            setLoading(false)
        }
    }, [locationName])

    // Sync dates when modal opens or initialDate changes
    useEffect(() => {
        if (isOpen) {
            if (initialDate) {
                setCustomDate(initialDate.split('T')[0])
            } else if (startDate) {
                setCustomDate(startDate.split('T')[0])
            }
            // Reset state
            setActiveTab(initialTab)

            if (initialTab === 'find' && initialCategory) {
                const category = availableActivities.find(a => a.name === initialCategory)
                if (category) {
                    setSelectedCategory(category)
                    handleSearch(category.name)
                } else {
                    setSubView('categories')
                }
            } else {
                setSubView('categories')
            }

            if (initialActivityData) {
                setCustomTitle(initialActivityData.description)
                setCustomLocation(initialActivityData.location_name || '')
                setCustomDate(initialDate ? initialDate.split('T')[0] : '')
                setCustomTime(initialActivityData.time)
                setCustomCost(initialActivityData.estimated_cost?.toString() || '')
                setCustomVenmoLink(initialActivityData.venmo_link || '')
                setActiveTab('custom')
            } else {
                setCustomTitle('')
                setCustomLocation('')
                setCustomTime('12:00')
                setCustomCost('')
                setCustomVenmoLink('')
                setSelectedCategory(null)
                setPlaces([])
                setSelectedPlace(null)
                setNewCategoryName('')
                setNewCategoryRequiresGps(true)
            }
        }
    }, [isOpen, startDate, initialDate, availableActivities, initialCategory, initialTab, handleSearch, initialActivityData])

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        setIsCreatingCategory(true)
        try {
            const result = await createNewActivityCategory(newCategoryName, newCategoryRequiresGps)
            if (result.success) {
                toast.success('Category created!')
                setNewCategoryName('')
                setSubView('categories')
                router.refresh()
            } else {
                toast.error(result.message || 'Failed to create category')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setIsCreatingCategory(false)
        }
    }

    // Generate date options
    const dateOptions = []
    if (startDate && endDate) {
        try {
            const start = parseISO(startDate)
            const end = parseISO(endDate)
            const days = eachDayOfInterval({ start, end })
            dateOptions.push(...days)
        } catch (e) {
            console.error('Date parsing error:', e)
        }
    }
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        const title = activeTab === 'custom' ? customTitle : selectedPlace?.displayName.text
        const location = activeTab === 'custom' ? customLocation : selectedPlace?.formattedAddress
        const date = customDate
        const time = customTime
        const cost = customCost ? Number(customCost) : undefined
        const venmoLink = customVenmoLink

        if (!title || !date) {
            toast.error('Phase specify title and date')
            return
        }

        if (onAdd) {
            // Client-side only (TripForm)
            onAdd({
                description: title,
                location_name: location,
                date,
                time,
                estimated_cost: cost,
                venmo_link: venmoLink
            })
            onClose()
            return
        }

        if (!tripId || typeof legIndex !== 'number') return

        setIsSubmitting(true)
        try {
            if (initialActivityData) {
                const result = await updateActivityInLegSchedule(
                    tripId,
                    legIndex,
                    date,
                    initialActivityData.index,
                    {
                        time,
                        description: title,
                        estimatedCost: cost,
                        locationName: location,
                        venmoLink
                    }
                )
                if (result.success) {
                    toast.success('Activity updated!')
                    onClose()
                    router.refresh()
                } else {
                    toast.error(result.message || 'Failed to update activity')
                }
            } else {
                const result = await addActivityToLegSchedule(
                    tripId,
                    legIndex,
                    date,
                    time,
                    title,
                    activeTab === 'find' ? selectedPlace : undefined,
                    cost,
                    location,
                    venmoLink
                )

                if (result.success) {
                    toast.success('Activity added to agenda!')
                    onClose()
                    router.refresh()
                } else {
                    toast.error(result.message || 'Failed to add activity')
                }
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    // For "Find Activities", we only show things that require GPS
    const gpsActivities = availableActivities.filter(a => a.requires_gps)

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialActivityData ? 'Edit Activity' : 'Add to Agenda'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {initialActivityData ? 'Update activity details' : 'Build your daily schedule'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tab Switcher - Hide if editing */}
                {!initialActivityData && (
                    <div className="px-6 py-4 flex gap-1 border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setActiveTab('custom')}
                            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Custom
                        </button>
                        <button
                            onClick={() => setActiveTab('find')}
                            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'find' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Find Activities
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {activeTab === 'custom' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Activity Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        placeholder="e.g. Lunch at the Pier"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={customLocation}
                                            onChange={(e) => setCustomLocation(e.target.value)}
                                            placeholder="Address or name"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            {dateOptions.length > 0 ? (
                                                <select
                                                    value={customDate}
                                                    onChange={(e) => setCustomDate(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                                                >
                                                    {dateOptions.map((d) => (
                                                        <option key={d.toISOString()} value={format(d, 'yyyy-MM-dd')}>
                                                            {format(d, 'ccc, MMM d')}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="date"
                                                    value={customDate}
                                                    onChange={(e) => setCustomDate(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="time"
                                                value={customTime}
                                                onChange={(e) => setCustomTime(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Est. Cost / Person</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={customCost}
                                            onChange={(e) => setCustomCost(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Venmo Link / Username (optional)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 opacity-50" />
                                        <input
                                            type="text"
                                            value={customVenmoLink}
                                            onChange={(e) => setCustomVenmoLink(e.target.value)}
                                            placeholder="e.g. Kyle-Beggan"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {subView === 'categories' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {gpsActivities.map((act, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedCategory(act)
                                                    handleSearch(act.name)
                                                }}
                                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 text-center transition-all group"
                                            >
                                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Search className="h-5 w-5" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 line-clamp-1">{act.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setSubView('create_category')}
                                            className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-indigo-500 hover:bg-indigo-50 text-center transition-all group"
                                        >
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-gray-200 shadow-sm">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold text-indigo-600">New Category</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {subView === 'create_category' && (
                                <form onSubmit={handleCreateCategory} className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                                    <button
                                        type="button"
                                        onClick={() => setSubView('categories')}
                                        className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                    >
                                        ← Back to categories
                                    </button>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g. Rooftop Bar"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <div className="flex-1">
                                                <label className="text-sm font-bold text-gray-900">Requires GPS Search?</label>
                                                <p className="text-xs text-gray-500">Enables searching for places by name.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNewCategoryRequiresGps(!newCategoryRequiresGps)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${newCategoryRequiresGps ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newCategoryRequiresGps ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isCreatingCategory || !newCategoryName.trim()}
                                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            Add Category
                                        </button>
                                    </div>
                                </form>
                            )}

                            {subView === 'search' && (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setSubView('categories')}
                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        ← Back to categories
                                    </button>
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        Results for <span className="text-indigo-600">{selectedCategory?.name}</span>
                                    </h3>

                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                                            <p className="text-sm">Finding best spots...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {places.map((place) => (
                                                <button
                                                    key={place.id}
                                                    onClick={() => {
                                                        setSelectedPlace(place)
                                                        setSubView('schedule')
                                                    }}
                                                    className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                                                >
                                                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                                        <Navigation className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{place.displayName.text}</h4>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{place.formattedAddress}</p>
                                                    </div>
                                                    <div className="self-center">
                                                        <Plus className="h-5 w-5 text-indigo-200 group-hover:text-indigo-600 transition-colors" />
                                                    </div>
                                                </button>
                                            ))}
                                            {places.length === 0 && (
                                                <div className="text-center py-12 text-gray-500">
                                                    No spots found nearby. Try a different category?
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {subView === 'schedule' && selectedPlace && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                                            <Navigation className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{selectedPlace.displayName.text}</h3>
                                            <p className="text-xs text-indigo-600">{selectedPlace.formattedAddress}</p>
                                        </div>
                                        <button onClick={() => setSubView('search')} className="ml-auto text-xs font-bold text-indigo-600 hover:underline">Change</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <select
                                                    value={customDate}
                                                    onChange={(e) => setCustomDate(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer text-sm"
                                                >
                                                    {dateOptions.map((d) => (
                                                        <option key={d.toISOString()} value={format(d, 'yyyy-MM-dd')}>
                                                            {format(d, 'ccc, MMM d')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="time"
                                                    value={customTime}
                                                    onChange={(e) => setCustomTime(e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Est. Cost / Person</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                value={customCost}
                                                onChange={(e) => setCustomCost(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Venmo Link / Username (optional)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 opacity-50" />
                                            <input
                                                type="text"
                                                value={customVenmoLink}
                                                onChange={(e) => setCustomVenmoLink(e.target.value)}
                                                placeholder="e.g. Kyle-Beggan"
                                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting || (activeTab === 'custom' && !customTitle) || (activeTab === 'find' && (subView !== 'schedule' && subView !== 'create_category')) || (subView === 'create_category')}
                        className="flex-[2] py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {initialActivityData ? 'Save Changes' : 'Add to Agenda'}
                    </button>
                </div>
            </div>
        </div>
    )
}
