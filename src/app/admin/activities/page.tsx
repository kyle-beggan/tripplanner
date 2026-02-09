'use client'

import { useEffect, useState } from 'react'
import { getActivities, createActivity, deleteActivity, updateActivity, type Activity } from './actions'
import { Loader2, Plus, Trash2, ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading] = useState(true)
    const [newActivity, setNewActivity] = useState('')
    const [requiresGps, setRequiresGps] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Confirmation state
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean
        title: string
        message: string
        action: () => Promise<void>
        isDestructive: boolean
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => { },
        isDestructive: false
    })
    const [processingAction, setProcessingAction] = useState(false)

    useEffect(() => {
        loadActivities()
    }, [])

    const loadActivities = async () => {
        setLoading(true)
        const data = await getActivities()
        setActivities(data || [])
        setLoading(false)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newActivity.trim()) return

        setSubmitting(true)
        const result = await createActivity(newActivity, 'General', requiresGps)

        if (result.success) {
            toast.success('Activity added')
            setNewActivity('')
            setRequiresGps(false)
            loadActivities()
        } else {
            toast.error(result.error || 'Failed to add activity')
        }
        setSubmitting(false)
    }

    const handleDelete = (id: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Activity',
            message: 'Are you sure you want to delete this activity?',
            isDestructive: true,
            action: async () => {
                const result = await deleteActivity(id)
                if (result.success) {
                    toast.success('Activity deleted')
                    loadActivities()
                } else {
                    toast.error(result.error || 'Failed to delete activity')
                }
            }
        })
    }

    const executeConfirmation = async () => {
        setProcessingAction(true)
        try {
            await confirmation.action()
            setConfirmation(prev => ({ ...prev, isOpen: false }))
        } finally {
            setProcessingAction(false)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Manage Activities</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Activity */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow rounded-lg p-6 sticky top-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Activity Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newActivity}
                                    onChange={(e) => setNewActivity(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="e.g. Hiking"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="requires-gps"
                                    type="checkbox"
                                    checked={requiresGps}
                                    onChange={(e) => setRequiresGps(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                <label htmlFor="requires-gps" className="ml-2 block text-sm text-gray-700">
                                    Requires GPS Support
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting || !newActivity.trim()}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                <span className="ml-2">Add Activity</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Activities */}
                {/* List Activities */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS Support</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : activities.length > 0 ? (
                                    activities.map((activity) => (
                                        <ActivityRow
                                            key={activity.id}
                                            activity={activity}
                                            onDelete={handleDelete}
                                            onUpdate={loadActivities}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No activities found. Add some to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeConfirmation}
                title={confirmation.title}
                message={confirmation.message}
                isDestructive={confirmation.isDestructive}
                isLoading={processingAction}
            />
        </div>
    )
}

function ActivityRow({
    activity,
    onDelete,
    onUpdate
}: {
    activity: Activity
    onDelete: (id: string) => void
    onUpdate: () => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(activity.name)
    const [requiresGps, setRequiresGps] = useState(activity.requires_gps)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        const result = await updateActivity(activity.id, name, requiresGps)

        if (result.success) {
            toast.success('Activity updated')
            setIsEditing(false)
            onUpdate()
        } else {
            toast.error(result.error || 'Failed to update')
        }
        setSaving(false)
    }

    if (isEditing) {
        return (
            <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1"
                    />
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={requiresGps}
                            onChange={(e) => setRequiresGps(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className="ml-2 text-sm text-gray-500">Requires GPS</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 text-xs font-semibold px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-900 text-xs font-semibold px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {activity.name}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {activity.requires_gps ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs text-center block w-8">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(activity.id)}
                        className="text-red-600 hover:text-red-900 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    )
}
