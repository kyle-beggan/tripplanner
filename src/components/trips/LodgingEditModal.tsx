'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, DollarSign, Globe, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { updateLodgingInLeg } from '@/app/trips/actions'

interface LodgingEditModalProps {
    isOpen: boolean
    onClose: () => void
    lodging: any
    tripId: string
    legIndex: number
    onUpdate?: () => void
}

export default function LodgingEditModal({
    isOpen,
    onClose,
    lodging,
    tripId,
    legIndex,
    onUpdate
}: LodgingEditModalProps) {
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [website, setWebsite] = useState('')
    const [totalCost, setTotalCost] = useState('')
    const [estCostPerPerson, setEstCostPerPerson] = useState('')
    const [totalBedrooms, setTotalBedrooms] = useState('')
    const [availableBedrooms, setAvailableBedrooms] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen && lodging) {
            setName(lodging.name || '')
            setAddress(lodging.address || '')
            setWebsite(lodging.website_uri || '')
            setTotalCost(lodging.total_cost ? lodging.total_cost.toString() : '')
            setEstCostPerPerson(lodging.estimated_cost_per_person ? lodging.estimated_cost_per_person.toString() : '')
            setTotalBedrooms(lodging.total_bedrooms !== undefined ? lodging.total_bedrooms.toString() : '')
            setAvailableBedrooms(lodging.available_bedrooms !== undefined ? lodging.available_bedrooms.toString() : '')
        }
    }, [isOpen, lodging])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Name is required')
            return
        }

        setIsSaving(true)
        try {
            const updates = {
                name,
                address,
                website_uri: website,
                total_cost: totalCost ? Number(totalCost) : undefined,
                estimated_cost_per_person: estCostPerPerson ? Number(estCostPerPerson) : undefined,
                total_bedrooms: totalBedrooms ? Number(totalBedrooms) : undefined,
                available_bedrooms: availableBedrooms ? Number(availableBedrooms) : undefined
            }

            const result = await updateLodgingInLeg(tripId, legIndex, lodging.id, updates)

            if (result.success) {
                toast.success('Lodging updated')
                onUpdate?.()
                onClose()
            } else {
                toast.error(result.message || 'Failed to update lodging')
            }
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update lodging')
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Lodging</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Hotel Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="123 Main St"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website Link
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Globe className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Cost
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={totalCost}
                                    onChange={(e) => setTotalCost(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Est. Per Person
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={estCostPerPerson}
                                    onChange={(e) => setEstCostPerPerson(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Bedrooms
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={totalBedrooms}
                                onChange={(e) => setTotalBedrooms(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Avail. Bedrooms
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={totalBedrooms || undefined}
                                value={availableBedrooms}
                                onChange={(e) => setAvailableBedrooms(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
