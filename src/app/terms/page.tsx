'use client';

import Link from 'next/link';

export default function TermsAndConditionsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-10 px-4 pb-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 md:p-8 space-y-4">
                <p className="text-gray-600">
                    Welcome to LFG Places. By using our application, you agree to comply with and be bound by the following terms and conditions of use.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">1. Usage</h2>
                <p className="text-gray-600">
                    You agree to use this application only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else&apos;s use and enjoyment of the application.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">2. Content</h2>
                <p className="text-gray-600">
                    The content of the pages of this application is for your general information and use only. It is subject to change without notice.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">3. SMS Communications</h2>
                <div className="text-gray-600 space-y-4">
                    <p>
                        A. By opting into SMS messaging from LFG Places, you agree to receive informational messages regarding account notifications, updates, and trip-related alerts. Message frequency varies. Message and data rates may apply. You may opt out at any time by replying STOP. Reply HELP for support.
                    </p>
                    <p>
                        B. We will only send communication related to your trips, such as activity reminders, invites, and coordination messages between trip participants.
                    </p>
                    <p>
                        C. You can cancel the SMS service at any time. Just text <b>&quot;STOP&quot;</b> to the short code. After you send the SMS message &quot;STOP&quot; to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again.
                    </p>
                    <p>
                        D. If you are experiencing issues with the messaging program you can reply with the keyword HELP for more assistance.
                    </p>
                    <p>
                        E. Carriers are not liable for delayed or undelivered messages.
                    </p>
                    <p>
                        F. Message and data rates may apply for any messages sent to you from us and to us from you. If you have any questions about your text plan or data plan, it is best to contact your wireless provider.
                    </p>
                    <p>
                        G. If you have any questions regarding privacy, please read our <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">privacy policy</Link>.
                    </p>
                </div>
            </div>
            
            <div className="text-center">
                <Link href="/profile" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    Back to Profile
                </Link>
            </div>
        </div>
    );
}
