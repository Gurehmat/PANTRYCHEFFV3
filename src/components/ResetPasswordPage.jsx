import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ResetPasswordPage({ recoveryFlagKey }) {
    const [loading, setLoading] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState(null)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters.')
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            setLoading(false)
            return
        }

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('Your reset link may have expired or was already used. Please request a new password reset link.')
                setLoading(false)
                return
            }
            const { error: err } = await supabase.auth.updateUser({ password: newPassword })
            if (err) throw err
            setMessage('Password updated. You can now sign in with your new password.')
            if (recoveryFlagKey && typeof window !== 'undefined') {
                sessionStorage.removeItem(recoveryFlagKey)
            }
            await supabase.auth.signOut()
        } catch (err) {
            setError(err.message || 'Failed to update password.')
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
                        <KeyRound className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
                    <p className="text-gray-500 mt-2 text-center">
                        Choose a strong password for your PantryChef account. You’ll use it to sign in from now on.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                        <input
                            type="password"
                            value={confirmPassword ?? ''}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            placeholder="Repeat your password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && (
                        <div className="space-y-2">
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                            {error.includes('expired') && (
                                <p className="text-center text-sm">
                                    <Link to="/auth/forgot-password" className="text-orange-600 font-medium hover:underline">
                                        Request a new reset link →
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}
                    </button>
                </form>

                {message && (
                    <p className="mt-4 text-center text-sm text-gray-600">
                        <Link to="/auth/signin" className="text-orange-600 font-medium hover:underline">
                            Sign in with your new password →
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}
