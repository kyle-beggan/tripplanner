'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
    title: string
    badge?: string | number
    children: React.ReactNode
    headerAction?: React.ReactNode
    defaultOpen?: boolean
    icon?: React.ReactNode
}

export default function CollapsibleSection({
    title,
    badge,
    children,
    headerAction,
    defaultOpen = false,
    icon
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <section className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-white px-6 py-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {icon}
                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</h2>
                        </div>
                        {badge !== undefined && (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                {badge}
                            </span>
                        )}
                    </div>
                    <div className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${isOpen ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </button>
                {headerAction && (
                    <div className="ml-4 pl-4 border-l border-gray-100">
                        {headerAction}
                    </div>
                )}
            </div>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="pt-6">
                        {children}
                    </div>
                </div>
            )}
        </section>
    )
}
