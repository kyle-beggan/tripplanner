'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User, ChevronDown, LogOut } from 'lucide-react'


export default function TopNav({ user, profile }: { user: any, profile: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User'
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url // fallback to OAuth avatar if synced

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm h-16 transition-colors">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo & Branding */}
                <div className="flex items-center gap-4">
                    <Link href="/trips" className="flex items-center gap-2" aria-label="Home">
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-lg border border-white bg-gradient-to-br from-white via-gray-100 to-gray-200">
                            <Image src="/LFGPlaces_logo.png" alt="LFG Places Logo" fill className="object-contain" />
                        </div>
                        {/* Title removed as requested */}
                        <span className="hidden md:block text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            LFG Places
                        </span>
                    </Link>

                </div>

                {/* Right Side: User Menu */}
                <div className="flex items-center gap-4">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-indigo-100 border border-indigo-200">
                                {avatarUrl ? (
                                    <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-sm font-medium text-indigo-600">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[150px] truncate">
                                {displayName}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100 animate-in fade-in zoom-in duration-200">
                                <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>

                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User className="h-4 w-4" />
                                    My Profile
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
