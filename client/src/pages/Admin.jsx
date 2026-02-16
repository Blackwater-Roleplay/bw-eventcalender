import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Login from '../components/Login'
import Setup from '../components/Setup'
import AdminDashboard from '../components/AdminDashboard'

function Admin() {
    const [loading, setLoading] = useState(true)
    const [setupRequired, setSetupRequired] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [admin, setAdmin] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            // Check if setup is required
            const setupRes = await fetch('/api/auth/setup-required')
            const setupData = await setupRes.json()

            if (setupData.setupRequired) {
                setSetupRequired(true)
                setLoading(false)
                return
            }

            // Check if user is authenticated
            const authRes = await fetch('/api/auth/me', {
                credentials: 'include'
            })

            if (authRes.ok) {
                const authData = await authRes.json()
                setAdmin(authData.admin)
                setIsAuthenticated(true)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLoginSuccess = (adminData) => {
        setAdmin(adminData)
        setIsAuthenticated(true)
        setSetupRequired(false)
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })
            setAdmin(null)
            setIsAuthenticated(false)
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (setupRequired) {
        return <Setup onSetupComplete={handleLoginSuccess} />
    }

    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />
    }

    return <AdminDashboard admin={admin} onLogout={handleLogout} />
}

export default Admin
