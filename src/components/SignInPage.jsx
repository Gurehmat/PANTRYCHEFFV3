import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Loader2, ChefHat, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SignInPage() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error: err } = await supabase.auth.signInWithPassword({ email, password })
            if (err) throw err
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-orange-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-orange-500 p-3 rounded-xl mb-4">
                        <ChefHat className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
                    <p className="text-gray-500 mt-2 text-center">
                        Sign in to access your pantry and recipes
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
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
                                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                required
                                minLength={6}
                                autoComplete="current-password"
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
                    <div className="flex justify-end">
                        <Link
                            to="/auth/forgot-password"
                            className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don’t have an account?{' '}
                    <Link to="/auth/signup" className="text-orange-600 font-medium hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
