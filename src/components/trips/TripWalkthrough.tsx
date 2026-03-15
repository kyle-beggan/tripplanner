'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Sparkles, HandMetal } from 'lucide-react'
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
        target: '#itinerary',
        title: "The Fun Part 🌴",
        content: "Check out the daily schedule here. See what's planned, where you're staying, and join individual activities."
    }
]

export default function TripWalkthrough() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(true)
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

    useEffect(() => {
        const updateHighlight = () => {
            const el = document.querySelector(steps[currentStep].target)
            if (el) {
                setHighlightRect(el.getBoundingClientRect())
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }

        updateHighlight()
        window.addEventListener('resize', updateHighlight)
        window.addEventListener('scroll', updateHighlight)

        return () => {
            window.removeEventListener('resize', updateHighlight)
            window.removeEventListener('scroll', updateHighlight)
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
        setIsVisible(false)
        await completeWalkthrough()
    }

    if (!isVisible || !highlightRect) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dark Overlay with Hole */}
            <div 
                className="absolute inset-0 bg-black/60 transition-all duration-500 ease-in-out"
                style={{
                    clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        ${highlightRect.left}px 100%, 
                        ${highlightRect.left}px ${highlightRect.top}px, 
                        ${highlightRect.right}px ${highlightRect.top}px, 
                        ${highlightRect.right}px ${highlightRect.bottom}px, 
                        ${highlightRect.left}px ${highlightRect.bottom}px, 
                        ${highlightRect.left}px 100%, 
                        100% 100%, 
                        100% 0%
                    )`
                }}
            />

            {/* Content Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="absolute pointer-events-auto bg-white rounded-2xl shadow-2xl p-6 w-80 border border-indigo-100 ring-1 ring-black/5"
                    style={{
                        left: Math.min(window.innerWidth - 340, Math.max(20, highlightRect.left + (highlightRect.width / 2) - 160)),
                        top: highlightRect.bottom + 20 > window.innerHeight - 250 
                            ? highlightRect.top - 250 
                            : highlightRect.bottom + 20
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
                            {currentStep === steps.length - 1 ? "Got it!" : "Next"}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
