import React from 'react'
import Navbar from './Navbar'

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <Navbar />
            <main className="pb-8">
                {children}
            </main>
        </div>
    )
}
