'use client'

import { login } from './actions'
import Image from 'next/image'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="relative h-48 w-48 overflow-hidden rounded-3xl shadow-xl border border-white mb-[25px] bg-gradient-to-br from-white via-gray-100 to-gray-200">
                        <Image src="/LFGPlaces_logo.png" alt="LFG Places Logo" fill className="object-contain" />
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                        Let&apos;s Find Great Places
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We can help you plan, organize, and execute your next group outing.
                    </p>
                </div>

                {message && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{message}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => login('google')}
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]"
                        >
                            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                    d="M12.0003 20.4001C16.6341 20.4001 20.5056 16.6341 20.5056 12.0003C20.5056 11.2359 20.3556 10.4996 20.0811 9.81457H12.0003V14.186H16.7844C16.5703 15.2892 15.6025 16.1245 14.4285 16.1245C13.0456 16.1245 11.8541 15.2638 11.3785 14.0536L8.43847 16.3275C9.84503 19.1171 12.75 20.4001 12.0003 20.4001Z"
                                    fill="#ea4335"
                                />
                                <path
                                    d="M23.4883 12.0003C23.4883 10.8753 23.3633 9.78767 23.1287 8.74268H12.0003V14.186H18.4529C18.1741 15.6599 17.3304 16.9236 16.1429 17.7214L19.9882 20.7303C22.2464 18.6366 23.4883 15.5499 23.4883 12.0003Z"
                                    fill="#4285f4"
                                />
                                <path
                                    d="M5.21556 13.9789C4.97544 13.2753 4.84277 12.5253 4.84277 11.7511C4.84277 10.9769 4.97544 10.2269 5.21556 9.52331L1.4427 6.64258C0.523047 8.16331 0 9.90795 0 11.7511C0 13.5942 0.523047 15.3389 1.4427 16.8596L5.21556 13.9789Z"
                                    fill="#fbbc04"
                                />
                                <path
                                    d="M12.0003 4.79979C14.0003 4.79979 15.6565 5.50027 16.9836 6.64258L20.1257 3.5005C18.0652 1.58784 15.2913 0.399658 12.0003 0.399658C7.59503 0.399658 3.73356 2.92429 1.94639 6.64258L5.72754 9.52331C6.44754 6.81232 8.99503 4.79979 12.0003 4.79979Z"
                                    fill="#34a853"
                                />
                            </svg>
                            Sign in with Google
                        </button>

                        <button
                            onClick={() => login('facebook')}
                            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#1877F2] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1864D0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877F2]"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Sign in with Facebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
