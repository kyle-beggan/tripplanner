import { getUserProfile } from '@/utils/get-user-profile'
import ProfileForm from '@/components/profile/ProfileForm'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const { user, profile } = await getUserProfile()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-full py-10 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            My Profile
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your personal information and profile settings.
                        </p>
                    </div>
                </div>

                <div className="bg-white shadow rounded-xl p-6 sm:p-8">
                    <ProfileForm user={user} profile={profile} />
                </div>
            </div>
        </div>
    )
}
