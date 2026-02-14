'use client'

import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Sparkles, X, Music } from 'lucide-react'

export const POP_ICONS = [
    { id: 'snoop', name: 'Snoop Dogg', description: 'Chill vibes and dizzle slang' },
    { id: 'jennifer', name: 'Jennifer Coolidge', description: 'Breathy, chaotic, and iconic' },
    { id: 'matthew', name: 'Matthew McConaughey', description: 'Alright, alright, alright' },
    { id: 'dude', name: 'The Dude', description: 'The Dude abides. Take it easy.' },
    { id: 'flavor', name: 'Flavor Flav', description: 'YEAH BOYEEEE! Clock is ticking.' },
    { id: 'borat', name: 'Borat', description: 'Very nice! Great success!' },
    { id: 'scarface', name: 'Tony Montana', description: 'Say hello to my little friend' },
    { id: 'pacino', name: 'Al Pacino', description: 'Hoo-ah! Great ass!' },
    { id: 'homer', name: 'Homer Simpson', description: 'D\'oh! Mmm... donuts.' },
    { id: 'seinfeld', name: 'Jerry Seinfeld', description: 'What\'s the deal with trips?' }
]

interface PersonaSelectModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: (personaId: string) => void
}

export default function PersonaSelectModal({
    isOpen,
    onClose,
    onGenerate
}: PersonaSelectModalProps) {
    const [selectedPersona, setSelectedPersona] = useState(POP_ICONS[0].id)

    const handleGenerate = () => {
        onGenerate(selectedPersona)
        onClose()
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-md sm:p-6"
                    >
                        <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                <Music className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <DialogTitle as="h3" className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2">
                                    Choose Your Persona
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                </DialogTitle>
                                <div className="mt-2 text-sm text-gray-500">
                                    Who should write your trip summary? Select an icon to get started.
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="relative">
                                        <select
                                            value={selectedPersona}
                                            onChange={(e) => setSelectedPersona(e.target.value)}
                                            className="block w-full rounded-xl border-gray-300 py-3 pl-4 pr-10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm appearance-none bg-gray-50 cursor-pointer transition-colors hover:bg-white"
                                        >
                                            {POP_ICONS.map((icon) => (
                                                <option key={icon.id} value={icon.id}>
                                                    {icon.name} — {icon.description}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="inline-flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-[0.98]"
                            >
                                Generate in their Voice
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
