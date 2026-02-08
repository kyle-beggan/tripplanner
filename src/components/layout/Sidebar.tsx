'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Map, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    isAdmin: boolean
}

export default function Sidebar({ isAdmin }: SidebarProps) {
    const pathname = usePathname()

    const navigation = [
        { name: 'Trips', href: '/trips', icon: Map },
        { name: 'Feedback', href: '/feedback', icon: MessageSquare },
        ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : []),
    ]

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:pt-16 lg:pb-4 dark:border-gray-800 dark:bg-gray-900 transition-colors z-40">
            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4">
                <nav className="mt-8 flex-1 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/10 dark:text-indigo-400'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400',
                                    'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400',
                                        'h-6 w-6 shrink-0 transition-colors'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
