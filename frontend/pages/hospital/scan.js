import { useState } from 'react';
import Head from 'next/head';
import { FiCamera, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/router';

export default function HospitalScan() {
    const [scanning, setScanning] = useState(false);
    const [manualPulseId, setManualPulseId] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const startScanning = async () => {
        try {
            const html5QrCode = new Html5Qrcode("qr-reader");

            setScanning(true);
            setError('');

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // Extract Pulse ID from URL
                    const pulseIdMatch = decodedText.match(/emergency\/([A-Z0-9-]+)/i);
                    if (pulseIdMatch) {
                        html5QrCode.stop();
                        router.push(`/emergency/${pulseIdMatch[1]}`);
                    } else {
                        setError('Invalid QR code. Please scan a MEDIX QR.');
                    }
                }
            );
        } catch (err) {
            setError('Unable to access camera. Please check permissions.');
            setScanning(false);
        }
    };

    const handleManualSearch = (e) => {
        e.preventDefault();
        if (manualPulseId.trim()) {
            router.push(`/emergency/${manualPulseId.trim()}`);
        }
    };

    return (
        <>
            <Head>
                <title>Hospital QR Scan - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="container-page py-12">
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-primary-700 mb-2">Hospital Access</h1>
                            <p className="text-gray-600">Scan patient QR code for emergency access</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* QR Scanner */}
                        <div className="card mb-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">Scan QR Code</h2>

                            <div id="qr-reader" className={`rounded-lg overflow-hidden mb-4 ${scanning ? '' : 'hidden'}`}></div>

                            {!scanning && (
                                <button
                                    onClick={startScanning}
                                    className="btn btn-primary w-full text-lg py-4"
                                >
                                    <FiCamera className="inline mr-2 text-xl" />
                                    Start Camera Scan
                                </button>
                            )}

                            <p className="text-sm text-gray-500 text-center mt-4">
                                Point your camera at the patient's MEDIX QR code
                            </p>
                        </div>

                        {/* Manual Entry */}
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-4 text-center">Or Enter Pulse ID Manually</h2>

                            <form onSubmit={handleManualSearch} className="space-y-4">
                                <div>
                                    <label htmlFor="pulseId" className="label">Pulse ID</label>
                                    <input
                                        id="pulseId"
                                        type="text"
                                        value={manualPulseId}
                                        onChange={(e) => setManualPulseId(e.target.value)}
                                        className="input font-mono"
                                        placeholder="PULSE-XXXXXXXX"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-secondary w-full text-lg"
                                >
                                    <FiSearch className="inline mr-2" />
                                    Access Emergency Profile
                                </button>
                            </form>
                        </div>

                        {/* Information */}
                        <div className="mt-8 card bg-blue-50 border border-blue-200">
                            <h3 className="font-bold text-blue-900 mb-3">Emergency Access</h3>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>✓ Emergency view shows critical medical info only</li>
                                <li>✓ No authentication required for emergency situations</li>
                                <li>✓ Comprehensive medical records require patient OTP consent</li>
                                <li>✓ All access is logged and visible to the patient</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
