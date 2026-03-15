'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles } from 'lucide-react'
import { completeWalkthrough } from '@/app/trips/actions'

interface Step {
    target: string
    title: string
    content: string
}

const steps: Step[] = [
    {
        target: '#walkthrough-header',
        title: "Welcome to your Trip! ✈️",
        content: "This is your trip dashboard. You can see the destination, dates, and who's hosting right here at the top."
    },
    {
        target: '#walkthrough-rsvp',
        title: "Let them know you're in! ✅",
        content: "Ready to go? Use the RSVP button to confirm your attendance and pick your specific dates."
    },
    {
        target: '#walkthrough-cost',
        title: "Track your budget 💰",
        content: "We calculate the estimated cost per person for you. You can toggle whether you're flying to see an updated total."
    },
    {
        target: '#walkthrough-flights',
        title: "Flight Estimates 🛫",
        content: "Check out the base flight prices here. We'll help you find the best options for your trip."
    },
    {
        target: '#itinerary',
        title: "The Trip Plan 🌴",
        content: "This is where the magic happens. Your daily itinerary is laid out here so you never miss a beat."
    },
    {
        target: '#walkthrough-schedule-tab',
        title: "Daily Schedule 📅",
        content: "View every activity planned for each leg of the trip. You can join individual events right from here!"
    },
    {
        target: '#walkthrough-lodging-tab',
        title: "Where to Stay 🏠",
        content: "Switch to the lodging tab to see where the group is staying or add your own lodging details."
    },
    {
        target: '#photos',
        title: "Capture the Memories 📸",
        content: "All photos uploaded by participants for this trip will show up here. Share your best shots!"
    },
    {
        target: '#whos-coming',
        title: "The Squad 👥",
        content: "See who else is coming on the trip and who's still pending. The more the merrier!"
    }
]

export default function TripWalkthrough() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(true)
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const targetSelector = steps[currentStep].target
        
        // Dispatch events for step-specific UI changes
        if (targetSelector === '#walkthrough-lodging-tab') {
            window.dispatchEvent(new CustomEvent('walkthrough-show-lodging'))
        }
        if (targetSelector === '#walkthrough-schedule-tab' || targetSelector === '#itinerary') {
            window.dispatchEvent(new CustomEvent('walkthrough-show-schedule'))
        }

        const update = () => {
            const el = document.querySelector(targetSelector)
            if (el) {
                const rect = el.getBoundingClientRect()
                setHighlightRect(rect)
            }
            rafRef.current = requestAnimationFrame(update)
        }

        // Trigger scroll once when step changes
        const el = document.querySelector(targetSelector)
        if (el) {
            const isItinerary = targetSelector === '#itinerary'
            if (isItinerary) {
                // Scroll to its position but with a 100px buffer at the top
                const main = document.querySelector('main')
                if (main) {
                    const y = el.getBoundingClientRect().top + main.scrollTop - 100
                    main.scrollTo({ top: y, behavior: 'smooth' })
                }
            } else {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }

        rafRef.current = requestAnimationFrame(update)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [currentStep])

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = async () => {
        // Stop the update loop to prevent fighting with the scroll
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        
        const main = document.querySelector('main')
        if (main) {
            main.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        
        // Give the smooth scroll enough time to finish before unmounting and revalidating
        setTimeout(async () => {
            setIsVisible(false)
            await completeWalkthrough()
        }, 800)
    }

    if (!isVisible || !highlightRect) return null

    // Add some padding to the highlight
    const PADDING = 12
    const top = highlightRect.top - PADDING
    const left = highlightRect.left - PADDING
    const right = highlightRect.right + PADDING
    const bottom = highlightRect.bottom + PADDING

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            {/* Dark Overlay with Hole */}
            <div 
                className="absolute inset-0 bg-black/60 transition-opacity duration-300"
                style={{
                    clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        ${left}px 100%, 
                        ${left}px ${top}px, 
                        ${right}px ${top}px, 
                        ${right}px ${bottom}px, 
                        ${left}px ${bottom}px, 
                        ${left}px 100%, 
                        100% 100%, 
                        100% 0%
                    )`
                }}
            />

            {/* Content Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute pointer-events-auto bg-white rounded-2xl shadow-2xl p-6 w-80 border border-indigo-100 ring-1 ring-black/5"
                    style={{
                        left: Math.min(window.innerWidth - 340, Math.max(20, left + (highlightRect.width / 2) - 160 + PADDING)),
                        top: (() => {
                            const cardHeight = 320
                            const space = 20
                            
                            // 1. Try below the highlight
                            if (bottom + space + cardHeight < window.innerHeight) {
                                return bottom + space
                            }
                            
                            // 2. Try above the highlight
                            if (top - space - cardHeight > 0) {
                                return top - space - cardHeight
                            }
                            
                            // 3. Fallback: Position in the middle of the viewport or near the top if it's a huge section
                            // but try to avoid the top edge
                            return Math.max(100, Math.min(window.innerHeight - cardHeight - 100, 200))
                        })()
                    }}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <button 
                            onClick={handleComplete}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {steps[currentStep].title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        {steps[currentStep].content}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div 
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={nextStep}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-200"
                        >
                            {currentStep === steps.length - 1 ? "Let's Go!" : "Explore Next"}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
