'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-10 px-4 pb-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 md:p-8 space-y-4">
                <p className="text-gray-600">
                    At LFG Places, we take your privacy seriously. This privacy policy describes how your personal information is collected, used, and shared.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">1. Information We Collect</h2>
                <p className="text-gray-600">
                    We collect information you provide directly to us, such as your name, email address, phone number, and any other details you choose to share in your profile.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">2. How We Use Your Information</h2>
                <p className="text-gray-600">
                    We use the information we collect to operate, maintain, and provide you with the features of the application, including communicating with you via SMS for account updates, trip notifications, and invitations.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">3. SMS Communications</h2>
                <p className="text-gray-600">
                    By providing your phone number, you explicitly consent to receive informational text messages. We do not sell or share your phone number with third parties for promotional purposes. You can reply STOP to any message to opt out.
                </p>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-6 border-b border-gray-50 pb-2">4. Terms and Conditions</h2>
                <p className="text-gray-600">
                    If you have any questions regarding terms, please read our <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">terms and conditions</Link>.
                </p>
            </div>
            
            <div className="text-center">
                <Link href="/profile" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                    Back to Profile
                </Link>
            </div>
        </div>
    );
}
