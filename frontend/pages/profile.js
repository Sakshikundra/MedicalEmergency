import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft, FiDownload, FiCopy, FiCheck, FiUser, FiEdit } from 'react-icons/fi';
import useAuth from '../lib/useAuth';
import { profileAPI } from '../lib/api';

export default function Profile() {
    const { user, loading: authLoading } = useAuth(true);
    const [accessLogs, setAccessLogs] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            loadAccessLogs();
        }
    }, [authLoading, user]);

    const loadAccessLogs = async () => {
        try {
            const response = await profileAPI.getAccessLogs();
            if (response.success) {
                setAccessLogs(response.data);
            }
        } catch (error) {
            console.error('Failed to load access logs:', error);
        }
    };

    const copyPulseId = () => {
        navigator.clipboard.writeText(user?.pulseId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQR = () => {
        const link = document.createElement('a');
        link.href = user?.qrCodeUrl;
        link.download = `pulse-id-${user?.pulseId}.png`;
        link.click();
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
    }

    return (
        <>
            <Head>
                <title>Profile - CareChain Passport</title>
            </Head>

            <div className="min-h-screen bg-gray-50">
                {/* Navigation */}
                <nav className="bg-white shadow-sm border-b">
                    <div className="container-page flex items-center justify-between py-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-primary-600">
                            <FiArrowLeft />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-primary-700">My Profile</h1>
                        <div className="w-24"></div> {/* Spacer */}
                    </div>
                </nav>

                <div className="container-page py-8">
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - QR Code */}
                        <div className="space-y-6">
                            <div className="card text-center">
                                <h3 className="font-bold text-xl mb-4">Emergency QR Code</h3>

                                {user?.qrCodeUrl && (
                                    <div className="mb-4">
                                        <img
                                            src={user.qrCodeUrl}
                                            alt="Emergency QR Code"
                                            className="mx-auto max-w-full rounded-lg shadow-soft"
                                        />
                                    </div>
                                )}

                                <div className="bg-primary-50 p-4 rounded-lg mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Your Pulse ID</p>
                                    <p className="font-mono font-bold text-xl text-primary-700 mb-3">{user?.pulseId}</p>
                                    <button
                                        onClick={copyPulseId}
                                        className="btn btn-secondary w-full text-sm"
                                    >
                                        {copied ? (
                                            <><FiCheck className="inline mr-2" /> Copied!</>
                                        ) : (
                                            <><FiCopy className="inline mr-2" /> Copy Pulse ID</>
                                        )}
                                    </button>
                                </div>

                                <button onClick={downloadQR} className="btn btn-primary w-full">
                                    <FiDownload className="inline mr-2" />
                                    Download QR Code
                                </button>

                                <p className="text-xs text-gray-500 mt-4">
                                    Print this QR code and keep it in your wallet for emergency access
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Profile Information */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Details */}
                            <div className="card">
                                <div className="card-header">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <FiUser className="text-primary-600" />
                                            Personal Information
                                        </h3>
                                        <Link href="/profile/edit" className="btn btn-secondary text-sm">
                                            <FiEdit className="inline mr-1" />
                                            Edit
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-600">Full Name</label>
                                        <p className="font-semibold text-lg">{user?.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Email</label>
                                        <p className="font-semibold text-lg">{user?.email}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Date of Birth</label>
                                        <p className="font-semibold text-lg">
                                            {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Gender</label>
                                        <p className="font-semibold text-lg">{user?.gender}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Blood Group</label>
                                        <p className="font-semibold text-lg text-red-600">{user?.bloodGroup}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-xl font-bold">Emergency Contact</h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-600">Name</label>
                                        <p className="font-semibold text-lg">{user?.emergencyContact?.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Relationship</label>
                                        <p className="font-semibold text-lg">{user?.emergencyContact?.relationship || 'N/A'}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Phone</label>
                                        <p className="font-semibold text-lg">{user?.emergencyContact?.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Access Logs */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="text-xl font-bold">Recent Access Log</h3>
                                    <p className="text-sm text-gray-600 mt-1">Track who accessed your medical records</p>
                                </div>

                                {accessLogs.length === 0 ? (
                                    <p className="text-center text-gray-600 py-4">No access logs yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {accessLogs.slice(0, 10).map((log) => (
                                            <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{log.accessedBy?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {log.accessType === 'emergency-view' && '🚨 Emergency View'}
                                                        {log.accessType === 'full-access' && '✅ Full Access (OTP Verified)'}
                                                        {log.accessType === 'qr-scan' && '📱 QR Scan'}
                                                        {log.accessType === 'hospital-upload' && '📄 Hospital Upload'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </p>
                                                    {log.consentGiven && (
                                                        <span className="badge badge-green text-xs mt-1">Consent Given</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
