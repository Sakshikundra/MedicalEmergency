import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    FiAlertTriangle, FiHeart, FiPhone, FiFileText, FiUpload, FiClock, FiShield,
} from 'react-icons/fi';
import { hospitalAPI } from '../../../lib/api';
import AskRecordsBox from '../../../components/AskRecordsBox';

export default function HospitalPatientView() {
    const router = useRouter();
    const { pulseId, consentId } = router.query;

    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Doctor upload form state
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState('consultation');
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');

    useEffect(() => {
        if (pulseId && consentId) {
            loadPatient();
        } else if (pulseId && !consentId) {
            setError('No consent ID found. Please complete the OTP verification first.');
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pulseId, consentId]);

    const loadPatient = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await hospitalAPI.getPatient(pulseId, consentId);
            if (response.success) {
                setPatientData(response.data);
            }
        } catch (err) {
            setError(err.message || 'Invalid or expired consent. Please request access again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setUploadMessage('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pulseId', pulseId);
            formData.append('consentId', consentId);
            formData.append('documentType', documentType);
            formData.append('notes', notes);

            const response = await hospitalAPI.uploadRecord(formData);
            if (response.success) {
                setUploadMessage('Record uploaded successfully.');
                setFile(null);
                setNotes('');
                loadPatient();
            }
        } catch (err) {
            setUploadMessage(err.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !patientData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="card max-w-md text-center">
                    <FiAlertTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Access Unavailable</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push(`/hospital/request-access?pulseId=${pulseId || ''}`)}
                        className="btn btn-primary"
                    >
                        Request Access Again
                    </button>
                </div>
            </div>
        );
    }

    const { profile, records, medicalSummary } = patientData;

    return (
        <>
            <Head>
                <title>Full Records - {profile?.pulseId} - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Consent banner */}
                    <div className="bg-primary-600 text-white rounded-2xl p-5 flex items-center gap-3">
                        <FiShield className="text-2xl flex-shrink-0" />
                        <div>
                            <p className="font-bold">Full Access Granted</p>
                            <p className="text-sm text-primary-100">
                                Verified via patient OTP consent. This access is time-limited and fully logged.
                            </p>
                        </div>
                    </div>

                    {/* Patient info */}
                    <div className="card bg-white">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold">{profile?.name}</h2>
                                <p className="text-gray-600 font-mono">Pulse ID: {profile?.pulseId}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <FiHeart className="text-3xl text-red-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Blood Group</p>
                                <p className="text-2xl font-bold text-red-600">{profile?.bloodGroup}</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-600">Date of Birth</p>
                                <p className="text-lg font-bold">
                                    {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">{profile?.gender}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <FiPhone className="text-2xl text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Emergency Contact</p>
                                <p className="font-bold">{profile?.emergencyContact?.name}</p>
                                <p className="text-sm text-primary-600">{profile?.emergencyContact?.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Records list */}
                    <div className="card bg-white">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FiFileText /> Medical Records ({medicalSummary?.totalRecords ?? records?.length ?? 0})
                        </h3>

                        {(!records || records.length === 0) && (
                            <p className="text-gray-500">No records on file yet.</p>
                        )}

                        <div className="space-y-3">
                            {records?.map((record) => (
                                <div key={record._id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold">{record.fileName}</p>
                                        <span className="badge badge-blue capitalize">{record.documentType}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                        <FiClock /> {record.uploadDate ? new Date(record.uploadDate).toLocaleString() : 'N/A'}
                                    </p>
                                    {record.aiAnalysis?.diagnoses?.length > 0 && (
                                        <p className="text-sm text-gray-700">
                                            <strong>Diagnoses:</strong> {record.aiAnalysis.diagnoses.join(', ')}
                                        </p>
                                    )}
                                    {record.aiAnalysis?.medications?.length > 0 && (
                                        <p className="text-sm text-gray-700">
                                            <strong>Medications:</strong>{' '}
                                            {record.aiAnalysis.medications
                                                .map((m) => (typeof m === 'string' ? m : `${m.name} (${m.dosage || 'n/a'})`))
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RAG Q&A — ask about this patient's full record history */}
                    <AskRecordsBox
                        onAsk={(question) => hospitalAPI.ask(pulseId, consentId, question)}
                        placeholder="e.g. Any known drug allergies or interactions?"
                    />

                    {/* Doctor upload form */}
                    <div className="card bg-white">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FiUpload /> Upload Treatment Record
                        </h3>

                        {uploadMessage && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                {uploadMessage}
                            </div>
                        )}

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="label">Document</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Document Type</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="input"
                                >
                                    <option value="consultation">Consultation</option>
                                    <option value="lab-report">Lab Report</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="discharge-summary">Discharge Summary</option>
                                    <option value="imaging">Imaging</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input"
                                    placeholder="e.g. Follow-up visit, ER treatment summary"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Upload Record'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
