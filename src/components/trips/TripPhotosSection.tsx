'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Filter, ImageIcon, Camera } from 'lucide-react'

interface Photo {
    url: string
    activityName: string
}

interface TripPhotosSectionProps {
    photos: Photo[]
}

export default function TripPhotosSection({ photos }: TripPhotosSectionProps) {
    const [filter, setFilter] = useState('all')
    const activities = Array.from(new Set(photos.map(p => p.activityName))).sort()

    const filteredPhotos = filter === 'all'
        ? photos
        : photos.filter(p => p.activityName === filter)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    Filter by Activity:
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full sm:w-72 rounded-xl border-gray-200 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50/50 transition-all cursor-pointer"
                >
                    <option value="all">All Trip Photos ({photos.length})</option>
                    {activities.map(act => (
                        <option key={act} value={act}>
                            {act} ({photos.filter(p => p.activityName === act).length})
                        </option>
                    ))}
                </select>
            </div>

            {filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredPhotos.map((photo, idx) => (
                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm ring-1 ring-black/5 hover:shadow-xl transition-all duration-300">
                            <Image
                                src={photo.url}
                                alt={photo.activityName}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                className="object-cover transition-transform group-hover:scale-110 duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Camera className="w-3 h-3 text-indigo-300" />
                                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Activity</span>
                                </div>
                                <p className="text-sm font-bold text-white tracking-tight line-clamp-2 leading-tight">
                                    {photo.activityName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold text-lg">No photos found</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                        {filter === 'all'
                            ? "This trip doesn't have any photos yet. Start adding some to your activities!"
                            : `No photos found for "${filter}".`}
                    </p>
                </div>
            )}
        </div>
    )
}
