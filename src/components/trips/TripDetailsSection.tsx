'use client'

import { useState } from 'react'
import { Sparkles, RefreshCcw, History, Save, Check, Loader2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { updateTripDescription } from '@/app/trips/actions'
import { toast } from 'sonner'
import PersonaSelectModal, { POP_ICONS } from '@/components/trips/PersonaSelectModal'

interface TripLeg {
    name: string
    start_date: string | null
    end_date: string | null
    activities: string[]
    schedule?: any[]
}

interface TripDetailsSectionProps {
    tripId: string
    tripName: string
    description: string | null
    legs: TripLeg[]
    startDate: string | null
    endDate: string | null
    participants: any[]
    isEditable: boolean
}

export default function TripDetailsSection({
    tripId,
    tripName,
    description,
    legs,
    startDate,
    endDate,
    participants,
    isEditable
}: TripDetailsSectionProps) {
    const [isGenerated, setIsGenerated] = useState(false)
    const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [hasSaved, setHasSaved] = useState(false)
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false)

    const generateSummary = (personaId: string) => {
        setHasSaved(false)
        const confirmedCount = participants.filter(p => p.status === 'going').length
        const locationNames = legs.map(l => l.name).filter(Boolean)
        const duration = startDate && endDate
            ? differenceInDays(new Date(endDate), new Date(startDate)) + 1
            : null

        const dateRange = startDate && endDate
            ? `${format(new Date(startDate), 'MMM d')} to ${format(new Date(endDate), 'MMM d')}`
            : 'TBD'

        const locations = locationNames.length > 0
            ? (locationNames.length === 1 ? locationNames[0] : `${locationNames.slice(0, -1).join(', ')} and ${locationNames[locationNames.length - 1]}`)
            : "mystery spots"

        // Get activity highlights
        const allActivityDescs: string[] = []
        legs.forEach(leg => {
            leg.schedule?.forEach(day => {
                day.activities?.forEach((act: any) => {
                    if (act.description) allActivityDescs.push(act.description)
                })
            })
        })
        const highlight = allActivityDescs.length > 0
            ? allActivityDescs[Math.floor(Math.random() * allActivityDescs.length)]
            : "chillin' with the squad"

        const personas: Record<string, string> = {
            snoop: `Sup nephew? We taking the "${tripName}" vibe to a whole new level in ${locations}. Touching down ${dateRange}, staying chill until we out. Got ${confirmedCount} real homies ready to roll with the squad. We gonna be straight chillin', especially when we hit ${highlight}. Keep it breezy, fo' shizzle dizzle.`,

            jennifer: `Wow... ${locations}. This whole "${tripName}" thing... it just makes me want to... it makes me want to hot dog real bad. Are we going from ${dateRange}? That's like... so many days of iconic chaos. ${confirmedCount} people are coming? That's... a lot of people. I hope we do ${highlight}. It's gonna be so sparkly and weird. I love it.`,

            matthew: `Alright, alright, alright. Look at us, heading to ${locations} for the "${tripName}". From ${dateRange}, we're gonna find that frequency, man. Just keep livin'. Got ${confirmedCount} souls already in the car. And ${highlight}? That's just the cherry on top. Just keep pedaling, brother.`,

            dude: `The Dude abides, man. We're sliding into ${locations} for ${tripName} from ${dateRange}. It really ties the whole trip together, you know? Got ${confirmedCount} achievers—wait, no, just regular guys—locked in. And ${highlight}? Careful man, there's a beverage here! Take it easy, man.`,

            flavor: `YEAH BOYEEEE! "${tripName.toUpperCase()}" TO ${locations.toUpperCase()} IS HAPPENING! CLOCK IS TICKING FROM ${dateRange.toUpperCase()}! WE GOT ${confirmedCount} PEOPLE IN THE HOUSE! FLAVOR FLAV! HIGHLIGHT: ${highlight.toUpperCase()}! DON'T BE LATE, BOYEEEE!`,

            borat: `Very nice! I like! My country of Kazakhstan is jealous of "${tripName}" to ${locations}. From ${dateRange}, we make great success! ${confirmedCount} peoples come with me in my carriage. I am very much excited for ${highlight}. High five!`,

            scarface: `You want to go to ${locations} for "${tripName}"? You think you can handle it? From ${dateRange}, we take over the world. I got ${confirmedCount} loyal soldiers ready to push it to the limit. My little friend ${highlight} is coming too. The world is yours, chico!`,

            pacino: `Hoo-ah! We're going to ${locations} for the "${tripName}"! Can you feel that? The heat? The energy? From ${dateRange}, we're just getting warmed up! I got ${confirmedCount} people who know the plan! And ${highlight}? GREAT ASS! I mean, great choice! I'm still standing!`,

            homer: `Mmm... ${locations}. *drools* "${tripName}" from ${dateRange}? D'oh! That's a lot of walking. But woo-hoo! ${confirmedCount} people are coming! Maybe we can get some donuts or ${highlight}. Simpson! Pack your bags! *burp*`,

            seinfeld: `What's the deal with ${locations}? And "${tripName}"... why is it called that? Who picked these dates, ${dateRange}? I've got ${confirmedCount} people in my building—I mean, on the trip. And ${highlight}? Is it an activity? Is it a hobby? I don't get it! *bass guitar slap*`
        }

        setGeneratedSummary(personas[personaId] || personas['snoop'])
        setIsGenerated(true)
    }

    const handleSaveSummary = async () => {
        if (!generatedSummary || !isEditable) return

        setIsSaving(true)
        try {
            const result = await updateTripDescription(tripId, generatedSummary)
            if (result.success) {
                toast.success('Summary saved to trip details!')
                setHasSaved(true)
                // Optional: You could even set isGenerated(false) to show the newly saved description
            } else {
                toast.error(result.message || 'Failed to save summary')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="bg-white shadow rounded-lg overflow-hidden flex flex-col h-full ring-1 ring-gray-200/50">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-semibold text-gray-900">Details</h2>
                <div className="flex items-center gap-2">
                    {isGenerated && isEditable && (
                        <button
                            onClick={handleSaveSummary}
                            disabled={isSaving || hasSaved}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hasSaved
                                ? 'bg-green-50 text-green-700 pointer-events-none'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : hasSaved ? (
                                <Check className="w-3.5 h-3.5" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            {isSaving ? 'Saving...' : hasSaved ? 'Saved' : 'Save to Trip'}
                        </button>
                    )}
                    <button
                        onClick={() => isGenerated ? setIsGenerated(false) : setIsPersonaModalOpen(true)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isGenerated
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-1 ring-inset ring-indigo-600/20'
                            }`}
                    >
                        {isGenerated ? (
                            <>
                                <History className="w-3.5 h-3.5" />
                                Show Original
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                Auto-generate Summary
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1">
                <div className="prose max-w-none">
                    {isGenerated ? (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                            <p className="text-indigo-900 leading-relaxed font-medium bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
                                {generatedSummary}
                            </p>
                            <p className="text-[10px] text-indigo-400 mt-2 flex items-center gap-1 italic">
                                <Sparkles className="w-2.5 h-2.5" />
                                Automatically generated based on trip data
                            </p>
                        </div>
                    ) : (
                        <div className="text-gray-600">
                            {description ? (
                                <p className="whitespace-pre-wrap">{description}</p>
                            ) : (
                                <p className="italic text-gray-500">No description provided for this trip yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <PersonaSelectModal
                isOpen={isPersonaModalOpen}
                onClose={() => setIsPersonaModalOpen(false)}
                onGenerate={(personaId) => generateSummary(personaId)}
            />
        </section>
    )
}
