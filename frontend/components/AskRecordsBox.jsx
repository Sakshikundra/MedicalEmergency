import { useState } from 'react';
import { FiMessageCircle, FiSend } from 'react-icons/fi';

/**
 * Small Q&A box that calls a RAG "ask" endpoint (either recordsAPI.ask for
 * the patient's own records, or hospitalAPI.ask for a consented doctor
 * session) and shows the answer plus which records it drew from.
 */
export default function AskRecordsBox({ onAsk, placeholder }) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError('');
        setAnswer(null);

        try {
            const response = await onAsk(question.trim());
            if (response.success) {
                setAnswer(response.data.answer);
                setSources(response.data.sources || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to get an answer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card bg-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FiMessageCircle /> Ask About These Records
            </h3>
            <p className="text-sm text-gray-500 mb-4">
                Ask a question across all records on file — e.g. "What medications
                is the patient on?" or "Any known allergies?"
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="input flex-1"
                    placeholder={placeholder || 'Ask a question...'}
                />
                <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiSend /> {loading ? '...' : 'Ask'}
                </button>
            </form>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
                    {error}
                </div>
            )}

            {answer && (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{answer}</p>
                    {sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-primary-200 flex flex-wrap gap-2">
                            {[...new Map(sources.map((s) => [s.fileName, s])).values()].map((s, i) => (
                                <span key={i} className="badge badge-blue">{s.fileName}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
