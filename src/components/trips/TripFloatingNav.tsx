'use client'

import React from 'react'
import { 
    DollarSign, 
    Calendar, 
    ImageIcon, 
    Users, 
    UserX
} from 'lucide-react'

interface NavItem {
    id: string
    label: string
    icon: React.ReactNode
    show?: boolean
}

interface TripFloatingNavProps {
    hasNotComing?: boolean
}

export default function TripFloatingNav({ hasNotComing = false }: TripFloatingNavProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const navItems: NavItem[] = [
        { id: 'details', label: 'Cost Per Person', icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> },
        { id: 'itinerary', label: 'Itinerary', icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> },
        { id: 'photos', label: 'Photos', icon: <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> },
        { id: 'whos-coming', label: "Who's Coming", icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} /> },
        { id: 'not-coming', label: "Who's Not Coming", icon: <UserX className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, show: hasNotComing },
    ]

    const handleNavClick = (id: string) => {
        if (typeof window === 'undefined') return;

        // In this layout, the scroll container is the <main> element
        const main = document.querySelector('main');
        if (!main) return;

        // 1. Trigger expansion
        window.dispatchEvent(new CustomEvent('expand-section', { detail: id }));

        // 2. Handle specific scroll behaviors
        if (id === 'details') {
            main.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (id === 'whos-coming') {
            // Try twice with different delays to ensure it reaches the true bottom after any lazy-loading/expansion
            setTimeout(() => {
                main.scrollTo({
                    top: main.scrollHeight,
                    behavior: 'smooth'
                });
            }, 300);
            setTimeout(() => {
                main.scrollTo({
                    top: main.scrollHeight,
                    behavior: 'smooth'
                });
            }, 600);
            return;
        }

        // Default scroll to element inside the <main> container
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    if (!mounted) return null;

    return (
        <div id="walkthrough-nav" className="sticky top-0 sm:fixed sm:right-6 sm:top-[45%] sm:-translate-y-1/2 z-[60] flex flex-row sm:flex-col gap-3 items-center sm:items-end print:hidden transition-all duration-300">
            <div className="flex flex-row sm:flex-col w-full sm:w-auto bg-indigo-600 sm:p-3 h-[50px] sm:h-auto sm:rounded-2xl shadow-2xl scale-100 ring-0 sm:ring-1 sm:ring-white/20 items-center justify-around sm:justify-center overflow-hidden">
                {navItems.filter(item => item.show !== false).map((item) => (
                    <div key={item.id} className="relative group flex items-center justify-center flex-1 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => handleNavClick(item.id)}
                            className="p-1 sm:p-4 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center h-full w-full sm:w-auto"
                            title={item.label}
                        >
                            {item.icon}
                        </button>
                        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white text-indigo-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg ring-1 ring-indigo-200 whitespace-nowrap">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
