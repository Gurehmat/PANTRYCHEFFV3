import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, ChefHat, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Auth({ authEvent }) {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mode, setMode] = useState('signin') // 'signin' or 'signup'
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const isPasswordRecovery = authEvent === 'PASSWORD_RECOVERY'

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage('Check your email for the confirmation link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            }
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

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
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            })
            if (error) throw error
            setMessage('Password updated. You can now sign in with your new password.')
            // End the recovery session and send user back to sign-in
            await supabase.auth.signOut()
        } catch (err) {
            setError(err.message || 'Failed to update password.')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        setError(null)
        setMessage(null)

        if (!email) {
            setError('Enter your email above first.')
            return
        }

        try {
            setLoading(true)
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/auth`,
            })
            if (error) throw error
            setMessage('Password reset email sent. Check your inbox.')
        } catch (err) {
            setError(err.message || 'Failed to send reset email.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-orange-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-orange-500 p-3 rounded-xl mb-4">
                        <ChefHat className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isPasswordRecovery ? 'Reset your password' : 'Welcome to PantryChef'}
                    </h1>
                    <p className="text-gray-500 mt-2 text-center">
                        {isPasswordRecovery
                            ? 'Choose a new password for your account.'
                            : mode === 'signin'
                                ? 'Sign in to access your pantry'
                                : 'Create an account to get started'}
                    </p>
                </div>

                <form onSubmit={isPasswordRecovery ? handleUpdatePassword : handleAuth} className="space-y-4">
                    {!isPasswordRecovery && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {mode === 'signin' && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline"
                                        disabled={loading}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {isPasswordRecovery && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isPasswordRecovery ? (
                            'Update password'
                        ) : mode === 'signin' ? (
                            'Sign In'
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                {!isPasswordRecovery && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        {mode === 'signin' ? (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => setMode('signup')}
                                    className="text-orange-600 font-medium hover:underline"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={() => setMode('signin')}
                                    className="text-orange-600 font-medium hover:underline"
                                >
                                    Sign In
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
