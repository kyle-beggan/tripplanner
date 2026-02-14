'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X,
    Clock,
    MapPin,
    Users,
    Image as ImageIcon,
    Upload,
    Loader2,
    Plus,
    Trash2,
    Check,
    ExternalLink,
    DollarSign
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import { addActivityPhoto, removeActivityPhoto, toggleActivityParticipation } from '@/app/trips/actions'

interface Participant {
    user_id: string
    profile: {
        full_name: string
        avatar_url: string | null
        first_name: string
        last_name: string
        username?: string
    }
}

interface ActivityDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    legIndex: number
    date: string
    activityIndex: number
    activity: {
        time: string
        description: string
        location_name?: string
        estimated_cost?: number
        venmo_link?: string
        participants?: string[]
        photos?: string[]
    }
    participants: Participant[]
    userId?: string
}

export default function ActivityDetailsModal({
    isOpen,
    onClose,
    tripId,
    legIndex,
    date,
    activityIndex,
    activity,
    participants,
    userId
}: ActivityDetailsModalProps) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'who'>('details')
    const [uploading, setUploading] = useState(false)
    const [joining, setJoining] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const joinedParticipants = participants.filter(p => activity.participants?.includes(p.user_id))
    const photos = activity.photos || []

    if (!isOpen) return null

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = event.target.files
            if (!files || files.length === 0) return

            setUploading(true)

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${tripId}/${date}/${activityIndex}-${Math.random()}.${fileExt}`
                const filePath = fileName

                const { error: uploadError } = await supabase.storage
                    .from('activity-photos')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('activity-photos').getPublicUrl(filePath)

                if (data) {
                    await addActivityPhoto(tripId, legIndex, date, activityIndex, data.publicUrl)
                }
            }

            toast.success(`Successfully uploaded ${files.length} photo${files.length > 1 ? 's' : ''}`)
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload photos')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemovePhoto = async (photoUrl: string) => {
        try {
            // Extract file path from URL if needed for storage deletion, 
            // but for now just remove from DB as per simplicity
            await removeActivityPhoto(tripId, legIndex, date, activityIndex, photoUrl)
            toast.success('Photo removed')
        } catch (error) {
            toast.error('Failed to remove photo')
        }
    }

    const handleToggleParticipation = async () => {
        if (!userId) {
            toast.error('You must be logged in to join activities')
            return
        }

        setJoining(true)
        try {
            const result = await toggleActivityParticipation(tripId, legIndex, date, activityIndex)
            if (result.success) {
                toast.success(isParticipating ? 'Left activity' : 'Joined activity')
            } else {
                toast.error(result.message || 'Failed to update participation')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setJoining(false)
        }
    }

    const isParticipating = userId && activity.participants?.includes(userId)

    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':')
        const hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
        return `${displayHour}:${m || '00'} ${ampm}`
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{activity.description}</h2>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(activity.time)} • {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4">
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-2.5 text-sm font-medium transition-all rounded-lg flex items-center justify-center gap-2 ${activeTab === 'details'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`flex-1 py-2.5 text-sm font-medium transition-all rounded-lg flex items-center justify-center gap-2 ${activeTab === 'photos'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            <ImageIcon className="w-4 h-4" /> Photos ({photos.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('who')}
                            className={`flex-1 py-2.5 text-sm font-medium transition-all rounded-lg flex items-center justify-center gap-2 ${activeTab === 'who'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            <Users className="w-4 h-4" /> Who&apos;s Coming ({joinedParticipants.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
                                            <MapPin className="w-4 h-4" /> Location
                                        </div>
                                        <p className="text-gray-900 text-sm font-medium">
                                            {activity.location_name || "No location details provided"}
                                        </p>
                                    </div>
                                    {activity.location_name && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location_name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-2"
                                        >
                                            View on Maps <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>

                                <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-1">
                                            <DollarSign className="w-4 h-4" /> Estimated Cost
                                        </div>
                                        <p className="text-gray-900 text-sm font-bold text-lg">
                                            {activity.estimated_cost && activity.estimated_cost > 0
                                                ? `$${activity.estimated_cost.toFixed(2)}`
                                                : "It's free!"}
                                        </p>
                                    </div>
                                    {activity.venmo_link && (
                                        <a
                                            href={activity.venmo_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-bold mt-2"
                                        >
                                            Pay via Venmo <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-tight">Participation</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {isParticipating
                                            ? "You're scheduled for this activity!"
                                            : "Join this activity to coordinate with others."}
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleParticipation}
                                    disabled={joining || !userId}
                                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${isParticipating
                                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                >
                                    {joining ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isParticipating ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Going
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Join Activity
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'photos' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Gallery</h3>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    Upload Photos
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </div>

                            {photos.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {photos.map((url, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm ring-1 ring-black/5">
                                            <Image
                                                src={url}
                                                alt={`Activity photo ${idx + 1}`}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-110 duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => handleRemovePhoto(url)}
                                                    className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-gray-900 font-bold">No photos yet</p>
                                    <p className="text-sm text-gray-500 mt-1">Be the first to share a memory from this activity!</p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-6 text-indigo-600 font-bold text-sm hover:text-indigo-800 flex items-center gap-1 bg-white px-4 py-2 rounded-full shadow-sm ring-1 ring-indigo-100"
                                    >
                                        <Plus className="w-4 h-4" /> Click to upload
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'who' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-4">The Squad</h3>
                            {joinedParticipants.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {joinedParticipants.map((p) => (
                                        <div key={p.user_id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-gray-50">
                                                {p.profile?.avatar_url ? (
                                                    <Image
                                                        src={p.profile.avatar_url}
                                                        alt={p.profile.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                                        {p.profile?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{p.profile?.full_name}</p>
                                                {p.profile?.username && (
                                                    <p className="text-xs text-gray-500 truncate">@{p.profile.username}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-center bg-green-50 text-green-600 p-1 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-gray-900 font-bold">Squad is empty</p>
                                    <p className="text-sm text-gray-500 mt-1">Join this activity to show up here!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
