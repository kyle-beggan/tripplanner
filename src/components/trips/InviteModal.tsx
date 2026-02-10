'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Send, Loader2, Plus, Info } from 'lucide-react'
import { sendTripInvitation, getTripItineraryPreview } from '@/app/trips/actions'
import { toast } from 'sonner'

interface InviteModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    tripName: string
}

export default function InviteModal({ isOpen, onClose, tripId, tripName }: InviteModalProps) {
    const [emails, setEmails] = useState('')
    const [message, setMessage] = useState(
        `Hey! I'm planning a trip to ${tripName} and thought you might want to join. Check out the details and RSVP here:`
    )
    const [isSending, setIsSending] = useState(false)
    const [itineraryHtml, setItineraryHtml] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            getTripItineraryPreview(tripId).then(setItineraryHtml)
        }
    }, [isOpen, tripId])

    if (!isOpen) return null

    const handleSend = async () => {
        if (!emails.trim()) {
            toast.error('Please enter at least one email address.')
            return
        }

        setIsSending(true)
        try {
            // Split emails by comma, newline, or semicolon and clean up
            const emailList = emails
                .split(/[\n,;]+/)
                .map(e => e.trim())
                .filter(e => e.length > 0)

            if (emailList.length === 0) {
                toast.error('No valid emails found.')
                setIsSending(false)
                return
            }

            const result = await sendTripInvitation(tripId, emailList, message)

            if (result.success) {
                toast.success(`Invitations sent to ${emailList.length} people!`)
                setEmails('')
                onClose()
            } else {
                toast.error(result.message || 'Failed to send invitations.')
            }
        } catch (error) {
            console.error('Send invite error:', error)
            toast.error('An unexpected error occurred.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-indigo-600" />
                            Invite Friends
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Send an email invitation to join this trip.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="emails" className="text-sm font-medium text-gray-700 block">
                            Email Addresses <span className="text-gray-400 font-normal">(comma separated)</span>
                        </label>
                        <textarea
                            id="emails"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            placeholder="friend@example.com, another@example.com"
                            className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
                        />
                    </div>

                    {/* Message Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="message" className="text-sm font-medium text-gray-700 block">
                                Message Preview
                            </label>
                            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                Editable
                            </span>
                        </div>
                        <div className="relative">
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full min-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-y"
                            />
                            <div className="absolute bottom-3 right-3">
                                <Info className="h-4 w-4 text-gray-300 pointer-events-none" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            A link to this trip page will be automatically appended to your message.
                        </p>
                    </div>

                    {/* Itinerary Preview */}
                    {itineraryHtml && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Itinerary Included
                            </label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="max-h-60 overflow-y-auto p-2 bg-white">
                                    <div
                                        className="scale-95 origin-top-left w-[105%]"
                                        dangerouslySetInnerHTML={{ __html: itineraryHtml }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !emails.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:shadow-none"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Invites
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
