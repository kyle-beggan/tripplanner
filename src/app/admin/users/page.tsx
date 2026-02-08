'use client'

import { useEffect, useState } from 'react'
import { getUsers, updateUserStatus, deleteUser } from '../actions'
import { Loader2, Check, X, Shield, User, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

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
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, status } : u))

        const result = await updateUserStatus(userId, status)
        if (result.error) {
            alert('Failed to update status: ' + result.error)
            loadUsers() // Revert on error
        }
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
                    alert('Failed to update role: ' + result.error)
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
                    alert('Failed to delete user: ' + result.error)
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
                <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'No Name'}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                            <div className="text-xs text-gray-400">{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                            user.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        {user.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        {user.role}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => alert('Edit functionality to be implemented')}
                                            className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 text-xs font-semibold px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                        >
                                            Edit
                                        </button>

                                        {user.role !== 'admin' && (
                                            <button
                                                onClick={() => handleMakeAdmin(user.id)}
                                                className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 text-xs font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                Make Admin
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
