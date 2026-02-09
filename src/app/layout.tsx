import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getUserProfile } from '@/utils/get-user-profile'
import TopNav from '@/components/layout/TopNav'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'LFG Places',
    description: 'Plan your next group adventure with LFG Places.',
    icons: {
        icon: '/LFGPlaces_logo.png',
        shortcut: '/LFGPlaces_logo.png',
        apple: '/LFGPlaces_logo.png',
    },
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const data = await getUserProfile()
    const user = data?.user
    const profile = data?.profile

    // Check if we are in an authenticated state roughly (user exists)
    // Ideally we might want different layouts for login vs app, 
    // but for now we'll conditionally render the chrome
    const showChrome = !!user

    return (
        <html lang="en" className="h-full bg-gray-50" suppressHydrationWarning>
            <body className={`${inter.className} h-full`}>
                <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
                    {showChrome && <TopNav user={user} profile={profile} />}

                    <div className="flex h-full">
                        {showChrome && <Sidebar isAdmin={profile?.role === 'admin'} />}

                        <main className={`flex-1 ${showChrome ? 'lg:pl-64 pt-16' : ''} h-full overflow-auto bg-gray-50 transition-colors`}>
                            {children}
                        </main>
                    </div>
                    <Toaster position="top-center" richColors />
                </ThemeProvider>
            </body>
        </html>
    )
}
