import { useState, useEffect } from 'react'

function EventForm({ event, onClose, onSave }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [color, setColor] = useState('#dc2626')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (event) {
            setTitle(event.title)
            setDescription(event.description || '')
            setStartDate(event.startDate.split('T')[0])
            setEndDate(event.endDate.split('T')[0])
            setColor(event.color)
        }
    }, [event])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (new Date(endDate) < new Date(startDate)) {
            setError('Enddatum darf nicht vor dem Startdatum liegen')
            return
        }

        setLoading(true)

        try {
            const url = event ? `/api/events/${event.id}` : '/api/events'
            const method = event ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    description: description || null,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate + 'T23:59:59').toISOString(),
                    color
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Fehler beim Speichern')
            }

            onSave()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const colorOptions = [
        '#dc2626', // Red
        '#ea580c', // Orange
        '#ca8a04', // Yellow
        '#16a34a', // Green
        '#0891b2', // Cyan
        '#2563eb', // Blue
        '#7c3aed', // Purple
        '#db2777', // Pink
    ]

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-6">
                    {event ? 'Event bearbeiten' : 'Neues Event'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Titel *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="Event Titel"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Beschreibung
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                            placeholder="Optionale Beschreibung"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Startdatum *
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Enddatum *
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Farbe
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {colorOptions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                            {loading ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EventForm
