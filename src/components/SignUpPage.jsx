import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, ChefHat, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SignUpPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        setError(null)

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            setLoading(false)
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            setLoading(false)
            return
        }

        try {
            const { error: err } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}${window.location.pathname}#/auth/signin`,
                },
            })
            if (err) throw err
            setMessage('Check your email for the confirmation link to activate your account.')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const benefits = [
        'Track what’s in your pantry',
        'Get recipes that use what you have',
        'Generate shopping lists',
        'Save favorite recipes',
    ]

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center p-4">
            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100">
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-orange-500 p-3 rounded-xl mb-4">
                            <ChefHat className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                        <p className="text-gray-500 mt-2 text-center">
                            Join PantryChef and cook smarter with what you already have.
                        </p>
                    </div>

                    <ul className="mb-6 space-y-2 text-sm text-gray-600">
                        {benefits.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Check className="w-3 h-3" />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>

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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                    placeholder="At least 6 characters"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                placeholder="Repeat your password"
                                required
                                minLength={6}
                                autoComplete="new-password"
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
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/auth/signin" className="text-orange-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
