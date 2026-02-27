import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout({ children }) {
    const location = useLocation()
    const isHome = location.pathname === '/home'

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <Navbar />
            <main className={isHome ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
                {children}
            </main>
        </div>
    )
}
