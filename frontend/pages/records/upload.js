import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiUpload, FiFile, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import useAuth from '../../lib/useAuth';
import { recordsAPI } from '../../lib/api';

export default function UploadRecord() {
    const { user, loading: authLoading } = useAuth(true);
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState('other');
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' or 'error'
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(selectedFile.type)) {
                setMessage('Please upload PDF, JPG, or PNG files only');
                setUploadStatus('error');
                return;
            }

            // Validate file size (10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setMessage('File size must be less than 10MB');
                setUploadStatus('error');
                return;
            }

            setFile(selectedFile);
            setUploadStatus(null);
            setMessage('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage('Please select a file first');
            setUploadStatus('error');
            return;
        }

        setUploading(true);
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('documentType', documentType);

            const response = await recordsAPI.upload(formData);

            if (response.success) {
                setUploadStatus('success');
                setMessage('✅ File uploaded! AI is analyzing in background (10-30 sec)...');

                // Redirect to records page after 2 seconds
                setTimeout(() => {
                    router.push('/records');
                }, 2000);
            }
        } catch (error) {
            console.error('Upload Error Details:', error);
            setUploadStatus('error');
            const errorMsg = typeof error === 'string'
                ? error
                : (error.message || error.error || 'Upload failed. Please try again.');
            setMessage(errorMsg);
        } finally {
            setUploading(false);
        }

    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;
    }

    return (
        <>
            <Head>
                <title>Upload Records - MEDIX</title>
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

                <div className="container-page py-8 max-w-2xl">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-2">Upload New Medical Document</h2>
                        <p className="text-gray-600 mb-6">
                            Our AI will automatically extract medical information from your document
                        </p>

                        {uploadStatus && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${uploadStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}>
                                {uploadStatus === 'success' ? (
                                    <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0 text-xl" />
                                ) : (
                                    <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0 text-xl" />
                                )}
                                <p className={`text-sm ${uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                    {message}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleUpload} className="space-y-6">
                            {/* File Upload Area */}
                            <div>
                                <label className="label">Select Medical Document</label>
                                <div className="mt-2">
                                    <label
                                        htmlFor="file-upload"
                                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {file ? (
                                                <>
                                                    <FiFile className="text-6xl text-primary-600 mb-4" />
                                                    <p className="mb-2 text-sm font-medium text-gray-700">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                                </>
                                            ) : (
                                                <>
                                                    <FiUpload className="text-6xl text-gray-400 mb-4" />
                                                    <p className="mb-2 text-sm text-gray-700">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Document Type */}
                            <div>
                                <label htmlFor="documentType" className="label">Document Type</label>
                                <select
                                    id="documentType"
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="input"
                                    disabled={uploading}
                                >
                                    <option value="lab-report">Lab Report</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="discharge-summary">Discharge Summary</option>
                                    <option value="imaging">Imaging (X-ray, MRI, CT)</option>
                                    <option value="consultation">Consultation Notes</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>✓ Your document is securely uploaded and encrypted</li>
                                    <li>✓ AI extracts text using OCR technology</li>
                                    <li>✓ Medical information is analyzed and structured</li>
                                    <li>✓ Risk assessment is performed automatically</li>
                                    <li>✓ Results appear in your dashboard within minutes</li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!file || uploading}
                                className="btn btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="spinner w-5 h-5"></div>
                                        Uploading & Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FiUpload />
                                        Upload & Analyze with AI
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
