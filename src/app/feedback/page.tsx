
import { getFeedbackList } from './actions'
import FeedbackList from './FeedbackList'
import CreateFeedbackButton from './CreateFeedbackButton'

export default async function FeedbackPage() {
    const feedback = await getFeedbackList()

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Help us improve LFG Places by reporting bugs or requesting features.
                    </p>
                </div>
                <CreateFeedbackButton />
            </div>

            <FeedbackList initialFeedback={feedback} />
        </div>
    )
}
