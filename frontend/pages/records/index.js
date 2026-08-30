import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import useAuth from '../../lib/useAuth';
import { recordsAPI } from '../../lib/api';
import AskRecordsBox from '../../components/AskRecordsBox';

export default function RecordsList() {
    const { user, loading: authLoading } = useAuth(true);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        if (!authLoading && user) {
            loadRecords();
        }
    }, [authLoading, user]);

    // Polling logic - only runs if there are processing records
    useEffect(() => {
        let pollInterval;

        const hasProcessing = records.some(r => r.processingStatus === 'processing');

        if (hasProcessing) {
            pollInterval = setInterval(() => {
                loadRecords();
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [records]); // Still depends on records, but won't loop because loadRecords is stable

    const loadRecords = async () => {
        try {
            const response = await recordsAPI.getAll();
            if (response.success) {
                // Better: check if data actually changed before setting
                setRecords(prev => {
                    const isSame = JSON.stringify(prev) === JSON.stringify(response.data);
                    return isSame ? prev : response.data;
                });
            }
        } catch (error) {
            console.error('Failed to load records:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            await recordsAPI.delete(id);
            setRecords(records.filter(r => r._id !== id));
        } catch (error) {
            alert('Failed to delete record');
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="badge badge-green">✓ Processed</span>;
            case 'processing': return <span className="badge badge-yellow">⏳ Processing...</span>;
            case 'failed': return <span className="badge badge-red">✗ Failed</span>;
            default: return <span className="badge badge-blue">⏳ Pending</span>;
        }
    };

    const getRiskBadge = (level) => {
        if (!level) return null;
        switch (level) {
            case 'RED': return <span className="badge badge-red">HIGH RISK</span>;
            case 'YELLOW': return <span className="badge badge-yellow">MODERATE</span>;
            case 'GREEN': return <span className="badge badge-green">LOW RISK</span>;
        }
    };

    return (
        <>
            <Head>
                <title>My Records - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Navigation */}
                <nav className="bg-white shadow-sm border-b">
                    <div className="container-page flex items-center justify-between py-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
                            <FiArrowLeft />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-primary-700">MEDIX</h1>
                        <div className="w-32"></div>
                    </div>
                </nav>

                <div className="container-page py-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold">{records.length} Record(s)</h2>
                        <Link href="/records/upload" className="btn btn-primary">
                            + Upload New Record
                        </Link>
                    </div>

                    {records.length === 0 ? (
                        <div className="card text-center py-12">
                            <FiUser className="text-6xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No Records Yet</h3>
                            <p className="text-gray-600 mb-6">Start by uploading your first medical document</p>
                            <Link href="/records/upload" className="btn btn-primary">
                                Upload Medical Record
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AskRecordsBox
                                onAsk={(question) => recordsAPI.ask(question)}
                                placeholder="e.g. What medications am I on?"
                            />

                            <div className="grid gap-6">
                            {records.map((record) => (
                                <div key={record._id} className="card hover:shadow-hover transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold mb-2">{record.fileName}</h3>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {getStatusBadge(record.processingStatus)}
                                                {record.aiAnalysis?.riskLevel && getRiskBadge(record.aiAnalysis.riskLevel)}
                                                <span className="badge badge-blue">{record.documentType}</span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(record.uploadDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(record._id)}
                                            className="btn bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {record.aiProcessed && record.aiAnalysis && (
                                        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                                            {record.aiAnalysis.diagnoses?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Diagnoses</h4>
                                                    <p className="text-sm">{record.aiAnalysis.diagnoses.join(', ')}</p>
                                                </div>
                                            )}

                                            {record.aiAnalysis.medications?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Medications</h4>
                                                    <p className="text-sm">
                                                        {record.aiAnalysis.medications.slice(0, 3).map(m =>
                                                            typeof m === 'string' ? m : m.name
                                                        ).join(', ')}
                                                    </p>
                                                </div>
                                            )}

                                            {record.aiAnalysis.patientExplanation && (
                                                <div className="md:col-span-2">
                                                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Summary</h4>
                                                    <p className="text-sm text-gray-700">{record.aiAnalysis.patientExplanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {record.processingStatus === 'processing' && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-gray-600">
                                                ⏳ AI is analyzing this document... This may take a few minutes.
                                            </p>
                                        </div>
                                    )}

                                    {record.processingStatus === 'failed' && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-red-600">
                                                ✗ Processing failed: {record.processingError || 'Unknown error'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
