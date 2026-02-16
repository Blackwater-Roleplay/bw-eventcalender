import { useState, useEffect } from 'react'
import EventForm from './EventForm'
import AdminManagement from './AdminManagement'

function AdminDashboard({ admin, onLogout }) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showEventForm, setShowEventForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)
    const [activeTab, setActiveTab] = useState('events')

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events')
            const data = await res.json()
            setEvents(data)
        } catch (error) {
            console.error('Fehler beim Laden der Events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteEvent = async (id) => {
        if (!confirm('Event wirklich löschen?')) return

        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (res.ok) {
                setEvents(events.filter(e => e.id !== id))
            }
        } catch (error) {
            console.error('Fehler beim Löschen:', error)
        }
    }

    const handleEditEvent = (event) => {
        setEditingEvent(event)
        setShowEventForm(true)
    }

    const handleEventSaved = () => {
        setShowEventForm(false)
        setEditingEvent(null)
        fetchEvents()
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('de-DE')
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">
                    <span className="text-primary-500">Admin</span> Dashboard
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">Angemeldet als <span className="text-white font-semibold">{admin.username}</span></span>
                    <a href="/" className="text-gray-400 hover:text-white transition-colors">Kalender</a>
                    <button
                        onClick={onLogout}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Abmelden
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'events'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'admins'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Admins
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {activeTab === 'events' && (
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Events verwalten</h2>
                            <button
                                onClick={() => {
                                    setEditingEvent(null)
                                    setShowEventForm(true)
                                }}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                                + Neues Event
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                        ) : events.length === 0 ? (
                            <p className="text-gray-400 text-center py-12">Keine Events vorhanden</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b border-gray-700">
                                            <th className="pb-3 px-2">Farbe</th>
                                            <th className="pb-3 px-2">Titel</th>
                                            <th className="pb-3 px-2">Start</th>
                                            <th className="pb-3 px-2">Ende</th>
                                            <th className="pb-3 px-2">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(event => (
                                            <tr key={event.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                <td className="py-3 px-2">
                                                    <div
                                                        className="w-6 h-6 rounded"
                                                        style={{ backgroundColor: event.color }}
                                                    ></div>
                                                </td>
                                                <td className="py-3 px-2 text-white font-medium">{event.title}</td>
                                                <td className="py-3 px-2 text-gray-300">{formatDate(event.startDate)}</td>
                                                <td className="py-3 px-2 text-gray-300">{formatDate(event.endDate)}</td>
                                                <td className="py-3 px-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditEvent(event)}
                                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            Bearbeiten
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            Löschen
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'admins' && <AdminManagement />}
            </div>

            {/* Event Form Modal */}
            {showEventForm && (
                <EventForm
                    event={editingEvent}
                    onClose={() => {
                        setShowEventForm(false)
                        setEditingEvent(null)
                    }}
                    onSave={handleEventSaved}
                />
            )}
        </div>
    )
}

export default AdminDashboard
