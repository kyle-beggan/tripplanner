import Link from 'next/link'
import { Users, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manage Users Card */}
                <Link href="/admin/users" className="block group">
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                                <Users className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    Manage Users
                                </h2>
                                <p className="text-sm text-gray-500">
                                    View users, approve registrations, and manage roles.
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Manage Activities Card */}
                <Link href="/admin/activities" className="block group">
                    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-green-100 rounded-lg text-green-600">
                                <Activity className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                    Manage Activities
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Curate the global list of activities available for trips.
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
