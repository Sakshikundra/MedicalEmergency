import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiHeart, FiAlertTriangle, FiPhone, FiClock, FiShield, FiDownload, FiRadio } from 'react-icons/fi';
import { emergencyAPI } from '../../lib/api';

export default function EmergencyProfile() {
    const router = useRouter();
    const { pulseId } = router.query;
    const [emergencyData, setEmergencyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sosStatus, setSosStatus] = useState('');
    const [sosLoading, setSosLoading] = useState(false);

    const handleSOS = async () => {
        setSosLoading(true);
        setSosStatus('');
        try {
            const sendWithLocation = (location) =>
                emergencyAPI.sendSOS({ pulseId, location }).then(() => {
                    setSosStatus('SOS alert sent to the emergency contact.');
                });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => sendWithLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                        .catch((err) => setSosStatus(err.message || 'Failed to send SOS alert.'))
                        .finally(() => setSosLoading(false)),
                    () => sendWithLocation(null)
                        .catch((err) => setSosStatus(err.message || 'Failed to send SOS alert.'))
                        .finally(() => setSosLoading(false))
                );
            } else {
                await sendWithLocation(null);
                setSosLoading(false);
            }
        } catch (err) {
            setSosStatus(err.message || 'Failed to send SOS alert.');
            setSosLoading(false);
        }
    };

    useEffect(() => {
        if (pulseId) {
            loadEmergencyProfile();
        }
    }, [pulseId]);

    const loadEmergencyProfile = async () => {
        try {
            const response = await emergencyAPI.getByPulseId(pulseId);

            if (response.success) {
                setEmergencyData(response.data);
            }
        } catch (err) {
            setError('Unable to load emergency profile. Invalid Pulse ID.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !emergencyData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                <div className="card max-w-md text-center">
                    <FiAlertTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Pulse ID Not Found</h2>
                    <p className="text-gray-600">{error || 'Invalid Pulse ID'}</p>
                </div>
            </div>
        );
    }

    const getRiskBadge = (level) => {
        switch (level) {
            case 'RED':
                return <span className="badge badge-red text-lg px-4 py-2">HIGH RISK ⚠️</span>;
            case 'YELLOW':
                return <span className="badge badge-yellow text-lg px-4 py-2">MODERATE RISK</span>;
            default:
                return <span className="badge badge-green text-lg px-4 py-2">LOW RISK ✓</span>;
        }
    };

    return (
        <>
            <Head>
                <title>Emergency Profile - {emergencyData.pulseId}</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8 px-4">
                {/* Emergency Header */}
                <div className="max-w-4xl mx-auto mb-6">
                    <div className="bg-red-600 text-white rounded-2xl p-6 text-center shadow-xl">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">🚨 EMERGENCY MEDICAL PROFILE</h1>
                        <p className="text-xl">Public Emergency Access - No Authentication Required</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Patient Info */}
                    <div className="card bg-white">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold">{emergencyData.name}</h2>
                                <p className="text-gray-600 font-mono text-lg">Pulse ID: {emergencyData.pulseId}</p>
                            </div>
                            {getRiskBadge(emergencyData.riskLevel)}
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <FiHeart className="text-4xl text-red-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Blood Group</p>
                                <p className="text-3xl font-bold text-red-600">{emergencyData.bloodGroup}</p>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">Age</p>
                                <p className="text-2xl font-bold">
                                    {emergencyData.dateOfBirth
                                        ? new Date().getFullYear() - new Date(emergencyData.dateOfBirth).getFullYear()
                                        : 'N/A'} years
                                </p>
                                <p className="text-sm text-gray-500">{emergencyData.gender}</p>
                            </div>

                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <FiPhone className="text-3xl text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Emergency Contact</p>
                                <p className="font-bold text-lg">{emergencyData.emergencyContact?.name}</p>
                                <p className="text-sm text-primary-600">{emergencyData.emergencyContact?.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Critical Medical Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Allergies */}
                        {emergencyData.allergies?.length > 0 && (
                            <div className="card bg-red-50 border-2 border-red-300">
                                <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                                    <FiAlertTriangle />
                                    ⚠️ ALLERGIES
                                </h3>
                                <ul className="space-y-2">
                                    {emergencyData.allergies.map((allergy, idx) => (
                                        <li key={idx} className="text-lg font-medium text-red-900 bg-white p-3 rounded-lg">
                                            • {allergy}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Chronic Conditions */}
                        {emergencyData.chronicConditions?.length > 0 && (
                            <div className="card bg-yellow-50 border-2 border-yellow-300">
                                <h3 className="text-xl font-bold text-yellow-800 mb-4">Chronic Conditions</h3>
                                <ul className="space-y-2">
                                    {emergencyData.chronicConditions.map((condition, idx) => (
                                        <li key={idx} className="text-lg text-yellow-900 bg-white p-3 rounded-lg">
                                            • {condition}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Current Medications */}
                        {emergencyData.currentMedications?.length > 0 && (
                            <div className="card bg-blue-50 border-2 border-blue-300">
                                <h3 className="text-xl font-bold text-blue-800 mb-4">Current Medications</h3>
                                <ul className="space-y-2">
                                    {emergencyData.currentMedications.map((med, idx) => (
                                        <li key={idx} className="text-lg text-blue-900 bg-white p-3 rounded-lg">
                                            • {typeof med === 'string' ? med : `${med.name} - ${med.dosage || 'Dosage unknown'}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Past Surgeries */}
                        {emergencyData.pastSurgeries?.length > 0 && (
                            <div className="card bg-purple-50 border-2 border-purple-300">
                                <h3 className="text-xl font-bold text-purple-800 mb-4">Past Surgeries</h3>
                                <ul className="space-y-2">
                                    {emergencyData.pastSurgeries.map((surgery, idx) => (
                                        <li key={idx} className="text-lg text-purple-900 bg-white p-3 rounded-lg">
                                            • {typeof surgery === 'string' ? surgery : surgery.procedure}
                                            {surgery.date && (
                                                <span className="text-sm text-gray-600 ml-2">
                                                    ({new Date(surgery.date).getFullYear()})
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Emergency Summary */}
                    {emergencyData.emergencySummary && (
                        <div className="card bg-gradient-to-r from-red-500 to-orange-500 text-white">
                            <h3 className="text-2xl font-bold mb-4">📋 Emergency Summary</h3>
                            <p className="text-lg leading-relaxed">{emergencyData.emergencySummary}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="grid sm:grid-cols-3 gap-4">
                        <button
                            onClick={handleSOS}
                            disabled={sosLoading}
                            className="btn btn-danger w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiRadio /> {sosLoading ? 'Sending...' : 'Send SOS Alert'}
                        </button>

                        <a
                            href={emergencyAPI.downloadCard(pulseId)}
                            className="btn btn-secondary w-full flex items-center justify-center gap-2"
                        >
                            <FiDownload /> Download Emergency Card
                        </a>

                        <Link
                            href={`/hospital/request-access?pulseId=${pulseId}`}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <FiShield /> Hospital Staff: Request Full Access
                        </Link>
                    </div>

                    {sosStatus && (
                        <div className="card bg-blue-50 border border-blue-200 text-center text-sm text-blue-800">
                            {sosStatus}
                        </div>
                    )}

                    {/* Disclaimer */}
                    <div className="card bg-gray-100">
                        <p className="text-sm text-gray-600 text-center">
                            <FiClock className="inline mr-2" />
                            This is emergency-only public access. For full medical records, hospital staff must request OTP consent from the patient.
                            <br />
                            <strong>Access logged and auditable by patient.</strong>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
