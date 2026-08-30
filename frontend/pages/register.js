import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiUser, FiMail, FiLock, FiHeart, FiPhone, FiCalendar, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { authAPI } from '../lib/api';
import useAuth from '../lib/useAuth';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        gender: '',
        bloodGroup: '',
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(false);
    const router = useRouter();

    useEffect(() => {
        if (router.query.email && typeof router.query.email === 'string') {
            setFormData((prev) => ({ ...prev, email: router.query.email }));
        }
    }, [router.query.email]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                emergencyContact: {
                    name: formData.emergencyContactName,
                    relationship: formData.emergencyContactRelationship,
                    phone: formData.emergencyContactPhone,
                },
            };

            const response = await authAPI.register(userData);

            if (response.success) {
                login(response.data.token, response.data.user);
            }
        } catch (err) {
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Registration failed. Please try again.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Create Pulse ID - MEDIX</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <h1 className="text-3xl font-bold text-primary-700">MEDIX</h1>
                        </Link>
                        <p className="mt-2 text-gray-600">Create your digital medical identity</p>
                    </div>

                    {/* Registration Card */}
                    <div className="bg-white rounded-2xl shadow-card p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Create Your Pulse ID</h2>
                            <p className="text-gray-600 mt-1">This will be your unique medical identifier</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <FiUser className="text-primary-600" />
                                    Personal Information
                                </h3>

                                <div>
                                    <label htmlFor="name" className="label">Full Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="dateOfBirth" className="label">
                                            <FiCalendar className="inline mr-1" />
                                            Date of Birth
                                        </label>
                                        <input
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="gender" className="label">Gender</label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="bloodGroup" className="label">
                                        <FiHeart className="inline mr-1 text-red-500" />
                                        Blood Group
                                    </label>
                                    <select
                                        id="bloodGroup"
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <FiMail className="text-primary-600" />
                                    Account Credentials
                                </h3>

                                <div>
                                    <label htmlFor="email" className="label">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="password" className="label">
                                            <FiLock className="inline mr-1" />
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="input"
                                            minLength="6"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <FiPhone className="text-primary-600" />
                                    Emergency Contact
                                </h3>

                                <div>
                                    <label htmlFor="emergencyContactName" className="label">Contact Name</label>
                                    <input
                                        id="emergencyContactName"
                                        name="emergencyContactName"
                                        type="text"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="emergencyContactRelationship" className="label">Relationship</label>
                                        <input
                                            id="emergencyContactRelationship"
                                            name="emergencyContactRelationship"
                                            type="text"
                                            value={formData.emergencyContactRelationship}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="e.g., Spouse, Parent"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="emergencyContactPhone" className="label">Phone Number</label>
                                        <input
                                            id="emergencyContactPhone"
                                            name="emergencyContactPhone"
                                            type="tel"
                                            value={formData.emergencyContactPhone}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="+1234567890"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full text-lg disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="spinner w-5 h-5"></div>
                                            Creating your Pulse ID...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FiCheckCircle />
                                            Create Pulse ID
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
