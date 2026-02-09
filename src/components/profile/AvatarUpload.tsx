'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
    uid: string
    url: string | null
    onUpload: (url: string) => void
    size?: number
}

export default function AvatarUpload({ uid, url, onUpload, size = 150 }: AvatarUploadProps) {
    const supabase = createClient()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (url) setAvatarUrl(url)
    }, [url])

    const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${uid}-${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

            if (data) {
                onUpload(data.publicUrl)
                setAvatarUrl(data.publicUrl)
            }

        } catch (error) {
            alert('Error uploading avatar!')
            console.log(error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-100"
                style={{ height: size, width: size }}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="Avatar"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Upload className="h-10 w-10 opacity-50" />
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex items-center">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
                    {uploading ? 'Uploading ...' : 'Upload Avatar'}
                    <input
                        style={{
                            visibility: 'hidden',
                            position: 'absolute',
                        }}
                        type="file"
                        id="single"
                        accept="image/*"
                        onChange={uploadAvatar}
                        disabled={uploading}
                    />
                </label>
            </div>
        </div>
    )
}
