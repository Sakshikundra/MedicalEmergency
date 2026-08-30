import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiShield, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { hospitalAPI } from '../../lib/api';

/**
 * Hospital / doctor consent flow:
 * 1. Staff enters the patient's Pulse ID + their own details, requests access.
 * 2. Backend sends an OTP to the patient's emergency contact (mock SMS by default).
 * 3. Staff enters the OTP the patient shares with them.
 * 4. On success, redirect to the full patient record view with the granted consentId.
 */
export default function RequestAccess() {
    const router = useRouter();
    const { pulseId: pulseIdFromQuery } = router.query;

    const [step, setStep] = useState('request'); // 'request' | 'otp'
    const [pulseId, setPulseId] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [institution, setInstitution] = useState('');
    const [purpose, setPurpose] = useState('');
    const [otp, setOtp] = useState('');
    const [consentId, setConsentId] = useState('');
    const [mockOtp, setMockOtp] = useState(''); // shown only in demo/mock SMS mode
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Prefill Pulse ID once the router query is ready (e.g. coming from the emergency page)
    useEffect(() => {
        if (pulseIdFromQuery && !pulseId) {
            setPulseId(pulseIdFromQuery.toString());
        }
    }, [pulseIdFromQuery]);

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await hospitalAPI.requestAccess({
                pulseId: pulseId.trim(),
                requester: {
                    name: doctorName,
                    institution,
                    purpose,
                },
            });

            if (response.success) {
                setConsentId(response.data.consentId);
                setMockOtp(response.data.mockOtp || '');
                setStep('otp');
            }
        } catch (err) {
            setError(err.message || 'Could not send OTP request. Check the Pulse ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await hospitalAPI.verifyOTP({ consentId, otp: otp.trim() });

            if (response.success) {
                router.push(`/hospital/patient/${pulseId.trim()}?consentId=${response.data.consentId}`);
            }
        } catch (err) {
            const attemptsMsg = err?.attemptsRemaining !== undefined
                ? ` (${err.attemptsRemaining} attempt${err.attemptsRemaining === 1 ? '' : 's'} remaining)`
                : '';
            setError((err.message || 'Invalid OTP') + attemptsMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Request Patient Access - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
                <div className="max-w-md mx-auto">
                    <Link href="/hospital/scan" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6">
                        <FiArrowLeft /> Back to scanner
                    </Link>

                    <div className="text-center mb-8">
                        <FiShield className="text-4xl text-primary-600 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold">Request Full Record Access</h1>
                        <p className="text-gray-600 mt-1">
                            Full records require the patient's consent, verified via OTP sent to
                            their emergency contact.
                        </p>
                    </div>

                    <div className="card bg-white">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {step === 'request' && (
                            <form onSubmit={handleRequestAccess} className="space-y-5">
                                <div>
                                    <label htmlFor="pulseId" className="label">Patient Pulse ID</label>
                                    <input
                                        id="pulseId"
                                        type="text"
                                        value={pulseId}
                                        onChange={(e) => setPulseId(e.target.value)}
                                        className="input font-mono"
                                        placeholder="PULSE-XXXXXXXX"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="doctorName" className="label">Your Name</label>
                                    <input
                                        id="doctorName"
                                        type="text"
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        className="input"
                                        placeholder="Dr. Jane Smith"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="institution" className="label">Hospital / Institution</label>
                                    <input
                                        id="institution"
                                        type="text"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                        className="input"
                                        placeholder="City General Hospital"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="purpose" className="label">Reason for Access</label>
                                    <input
                                        id="purpose"
                                        type="text"
                                        value={purpose}
                                        onChange={(e) => setPurpose(e.target.value)}
                                        className="input"
                                        placeholder="e.g. ER treatment, follow-up consultation"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="spinner w-5 h-5"></div>
                                            Sending OTP...
                                        </span>
                                    ) : (
                                        'Send OTP to Patient'
                                    )}
                                </button>
                            </form>
                        )}

                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <FiCheckCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-blue-800">
                                        OTP sent to the patient's emergency contact. Ask them to share
                                        the code with you, then enter it below. It expires in 5 minutes.
                                    </p>
                                </div>

                                {mockOtp && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                        <strong>Demo mode (mock SMS):</strong> OTP is <span className="font-mono font-bold">{mockOtp}</span>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="otp" className="label">Enter OTP</label>
                                    <input
                                        id="otp"
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="input font-mono text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="spinner w-5 h-5"></div>
                                            Verifying...
                                        </span>
                                    ) : (
                                        'Verify & Access Records'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('request'); setOtp(''); setError(''); }}
                                    className="btn btn-secondary w-full"
                                >
                                    Start Over
                                </button>
                            </form>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-6">
                        Every access request is logged and visible to the patient in their audit trail.
                    </p>
                </div>
            </div>
        </>
    );
}
