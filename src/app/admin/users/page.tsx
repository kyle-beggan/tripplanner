'use client'

import { useEffect, useState } from 'react'
import { getUsers, updateUserStatus, deleteUser } from '../actions'
import { Loader2, Check, X, Shield, User, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { toast } from 'sonner'

interface Profile {
    id: string
    email: string
    username: string
    full_name: string
    avatar_url: string
    role: 'user' | 'admin'
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function AdminPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
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
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        const data = await getUsers()
        // @ts-ignore - Supabase types might be inferred loosely
        setUsers(data as Profile[])
        setLoading(false)
    }

    const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
        setProcessingAction(true)
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))

        const result = await updateUserStatus(userId, status)
        if (result.error) {
            toast.error('Failed to update status: ' + result.error)
            await loadUsers() // Revert on error
        } else {
            // Optional: loadUsers() again to be absolutely sure, 
            // but the revalidatePath should handle it if using server components.
            // For client state, let's just confirm it worked.
            await loadUsers()
        }
        setProcessingAction(false)
    }

    const handleMakeAdmin = (userId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Make Admin',
            message: 'Are you sure you want to make this user an Admin?',
            isDestructive: false,
            action: async () => {
                const result = await updateUserStatus(userId, 'approved', 'admin')
                if (result.error) {
                    toast.error('Failed to update role: ' + result.error)
                } else {
                    loadUsers()
                }
            }
        })
    }

    const handleDeleteUser = (userId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            isDestructive: true,
            action: async () => {
                const result = await deleteUser(userId)
                if (result.success) {
                    loadUsers()
                } else {
                    toast.error('Failed to delete user: ' + result.error)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Approval</h3>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                        {users.filter(u => u.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {users.filter(u => u.status === 'approved').length}
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 relative">
                                            {user.avatar_url ? (
                                                <Image className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt="" fill />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                            <div className="text-xs text-gray-400">{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        {user.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        {user.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {user.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                className="text-green-600 hover:text-green-900 text-xs font-semibold px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}

                                        <button
                                            onClick={() => toast.info('Edit functionality to be implemented')}
                                            className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                        >
                                            Edit
                                        </button>

                                        {user.role !== 'admin' && (
                                            <button
                                                onClick={() => handleMakeAdmin(user.id)}
                                                className="text-blue-600 hover:text-blue-900 text-xs font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                Make Admin
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
