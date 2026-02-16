import { useState, useEffect } from 'react'

function AdminManagement() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [formLoading, setFormLoading] = useState(false)

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admin', {
                credentials: 'include'
            })
            const data = await res.json()
            setAdmins(data)
        } catch (error) {
            console.error('Fehler beim Laden der Admins:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAdmin = async (e) => {
        e.preventDefault()
        setError('')
        setFormLoading(true)

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Erstellen')
            }

            setAdmins([...admins, data])
            setShowForm(false)
            setUsername('')
            setPassword('')
        } catch (err) {
            setError(err.message)
        } finally {
            setFormLoading(false)
        }
    }

    const handleDeleteAdmin = async (id) => {
        if (!confirm('Admin wirklich löschen?')) return

        try {
            const res = await fetch(`/api/admin/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Löschen')
            }

            setAdmins(admins.filter(a => a.id !== id))
        } catch (error) {
            alert(error.message)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Admins verwalten</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    + Neuer Admin
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-700">
                                <th className="pb-3 px-2">Benutzername</th>
                                <th className="pb-3 px-2">Erstellt am</th>
                                <th className="pb-3 px-2">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="py-3 px-2 text-white font-medium">{admin.username}</td>
                                    <td className="py-3 px-2 text-gray-300">{formatDate(admin.createdAt)}</td>
                                    <td className="py-3 px-2">
                                        <button
                                            onClick={() => handleDeleteAdmin(admin.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Löschen
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Admin Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Neuer Admin</h2>

                        <form onSubmit={handleCreateAdmin} className="space-y-5">
                            {error && (
                                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Benutzername
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    placeholder="Benutzername"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Passwort
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    placeholder="Mindestens 6 Zeichen"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                >
                                    {formLoading ? 'Erstellen...' : 'Erstellen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminManagement
