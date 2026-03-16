'use client'

import { Users } from 'lucide-react'

interface TripHeaderGoingButtonProps {
    totalConfirmed: number
}

export default function TripHeaderGoingButton({ totalConfirmed }: TripHeaderGoingButtonProps) {
    const handleClick = () => {
        // 1. Update hash for URL consistency
        window.location.hash = 'whos-coming';
        // 2. Trigger expansion via custom event
        window.dispatchEvent(new CustomEvent('expand-section', { detail: 'whos-coming' }));
        // 3. Scroll to the bottom of the page with a slight delay to allow expansion
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    return (
        <button 
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors text-[11px] sm:text-sm font-medium border border-indigo-200/50 cursor-pointer shadow-sm active:scale-95 transform"
        >
            <Users className="h-4 w-4" />
            {totalConfirmed} {totalConfirmed === 1 ? 'Person' : 'People'} Going
        </button>
    )
}
