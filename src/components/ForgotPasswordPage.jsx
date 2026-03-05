import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function ForgotPasswordPage({ recoveryFlagKey }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        if (!email.trim()) {
            setError('Please enter your email address.')
            return
        }
        try {
            setLoading(true)
            if (recoveryFlagKey && typeof window !== 'undefined') {
                sessionStorage.setItem(recoveryFlagKey, '1')
            }
            const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}${window.location.pathname}#/auth/reset-password`,
            })
            if (err) throw err
            setMessage('Check your email for a link to reset your password. The link will expire in an hour.')
        } catch (err) {
            setError(err.message || 'Failed to send reset email.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
            <Link
                to="/auth/signin"
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Back to sign in
            </Link>
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-orange-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-amber-500 p-3 rounded-xl mb-4">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
                    <p className="text-gray-500 mt-2 text-center">
                        Enter the email you use for PantryChef and we’ll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send reset link'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to="/auth/signin" className="text-orange-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}
