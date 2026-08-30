import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiUpload, FiUser, FiLogOut, FiAlertCircle, FiActivity, FiFileText, FiDownload, FiCamera } from 'react-icons/fi';
import useAuth from '../../lib/useAuth';
import { profileAPI, recordsAPI } from '../../lib/api';

export default function Dashboard() {
    const { user, loading: authLoading, logout } = useAuth(true);
    const [healthSummary, setHealthSummary] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            loadDashboardData();
        }
    }, [authLoading, user]);

    const loadDashboardData = async () => {
        try {
            const [summaryRes, timelineRes] = await Promise.all([
                profileAPI.getHealthSummary(),
                recordsAPI.getTimeline(),
            ]);

            if (summaryRes.success) setHealthSummary(summaryRes.data);
            if (timelineRes.success) setTimeline(timelineRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const getRiskColor = (level) => {
        switch (level) {
            case 'RED': return 'risk-red';
            case 'YELLOW': return 'risk-yellow';
            default: return 'risk-green';
        }
    };

    const getBadgeClass = (level) => {
        switch (level) {
            case 'RED': return 'badge-red';
            case 'YELLOW': return 'badge-yellow';
            default: return 'badge-green';
        }
    };

    return (
        <>
            <Head>
                <title>Dashboard - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Navigation */}
                <nav className="bg-white shadow-sm border-b">
                    <div className="container-page flex items-center justify-between py-4">
                        <h1 className="text-2xl font-bold text-primary-700">MEDIX</h1>

                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="btn btn-secondary flex items-center gap-2">
                                <FiUser />
                                Profile
                            </Link>
                            <button onClick={logout} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                                <FiLogOut />
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="container-page py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
                        <p className="text-gray-600">Your Pulse ID: <span className="font-mono font-bold text-primary-600">{user?.pulseId}</span></p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/records/upload" className="card hover:shadow-hover transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                    <FiUpload className="text-2xl text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Upload Records</h3>
                                    <p className="text-sm text-gray-600">Add medical documents</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/profile" className="card hover:shadow-hover transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <FiUser className="text-2xl text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">View QR Code</h3>
                                    <p className="text-sm text-gray-600">Emergency access</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/records" className="card hover:shadow-hover transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FiFileText className="text-2xl text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">My Records</h3>
                                    <p className="text-sm text-gray-600">View all documents</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/hospital/scan" className="card hover:shadow-hover transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <FiCamera className="text-2xl text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Scan QR Code</h3>
                                    <p className="text-sm text-gray-600">Access emergency info</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Health Summary */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* AI Health Summary Card */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <FiActivity className="text-primary-600" />
                                            AI Health Summary
                                        </h3>
                                        {healthSummary && (
                                            <span className={`badge ${getBadgeClass(healthSummary.riskLevel)}`}>
                                                {healthSummary.riskLevel} RISK
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!healthSummary || healthSummary.totalRecords === 0 ? (
                                    <div className="text-center py-8">
                                        <FiAlertCircle className="text-5xl text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">No medical records uploaded yet.</p>
                                        <Link href="/records/upload" className="btn btn-primary mt-4">
                                            Upload Your First Record
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-gray-700">{healthSummary.summary}</p>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {healthSummary.allergies?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-red-700 mb-2">⚠️ Allergies</h4>
                                                    <ul className="space-y-1">
                                                        {healthSummary.allergies.map((allergy, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">• {allergy}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {healthSummary.chronicConditions?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-orange-700 mb-2">Chronic Conditions</h4>
                                                    <ul className="space-y-1">
                                                        {healthSummary.chronicConditions.map((condition, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">• {condition}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {healthSummary.currentMedications?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-blue-700 mb-2">Current Medications</h4>
                                                    <ul className="space-y-1">
                                                        {healthSummary.currentMedications.slice(0, 5).map((med, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">
                                                                • {typeof med === 'string' ? med : `${med.name} (${med.dosage || 'N/A'})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {healthSummary.riskFactors?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-yellow-700 mb-2">Risk Factors</h4>
                                                    <ul className="space-y-1">
                                                        {healthSummary.riskFactors.map((factor, idx) => (
                                                            <li key={idx} className="text-sm text-gray-700">• {factor}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-gray-500">
                                                Last updated: {new Date(healthSummary.lastUpdated).toLocaleDateString()}
                                                {' • '}
                                                {healthSummary.totalRecords} record(s) on file
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Medical Timeline */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <FiFileText className="text-primary-600" />
                                        Medical History Timeline
                                    </h3>
                                </div>

                                {timeline.length === 0 ? (
                                    <p className="text-gray-600 text-center py-4">No records yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        {timeline.slice(0, 5).map((record) => (
                                            <div key={record.id} className="flex gap-4 pb-4 border-b last:border-0">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-3 h-3 rounded-full mt-1 ${record.riskLevel === 'RED' ? 'bg-red-500' :
                                                        record.riskLevel === 'YELLOW' ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold">{record.fileName}</h4>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{record.summary}</p>
                                                    <span className="badge badge-blue text-xs">{record.type}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {timeline.length > 5 && (
                                            <Link href="/records" className="btn btn-secondary w-full">
                                                View All Records ({timeline.length})
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar - Risk Indicator */}
                        <div className="space-y-6">
                            <div className="card text-center">
                                <h3 className="font-bold text-lg mb-4">Health Risk Level</h3>
                                <div className={`risk-indicator mx-auto ${getRiskColor(healthSummary?.riskLevel || 'GREEN')}`}>
                                    {healthSummary?.riskLevel || 'GREEN'}
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                    {healthSummary?.riskLevel === 'RED' && 'High risk conditions detected'}
                                    {healthSummary?.riskLevel === 'YELLOW' && 'Moderate risk factors present'}
                                    {(!healthSummary || healthSummary?.riskLevel === 'GREEN') && 'No major risks identified'}
                                </p>
                            </div>

                            {/* QR Code Quick Access */}
                            <div className="card text-center">
                                <h3 className="font-bold text-lg mb-4">Emergency QR Code</h3>
                                {user?.qrCodeUrl && (
                                    <img
                                        src={user.qrCodeUrl}
                                        alt="Emergency QR Code"
                                        className="mx-auto mb-4 max-w-[200px]"
                                    />
                                )}
                                <Link href="/profile" className="btn btn-primary w-full">
                                    <FiDownload className="inline mr-2" />
                                    Download QR
                                </Link>
                                <p className="text-xs text-gray-500 mt-3">
                                    Scan for instant emergency access
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
