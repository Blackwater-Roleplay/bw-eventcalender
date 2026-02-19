import { useState, useEffect } from 'react'

const WEEKDAYS = [
    { key: 'monday', label: 'Montag', dayNum: 1 },
    { key: 'tuesday', label: 'Dienstag', dayNum: 2 },
    { key: 'wednesday', label: 'Mittwoch', dayNum: 3 },
    { key: 'thursday', label: 'Donnerstag', dayNum: 4 },
    { key: 'friday', label: 'Freitag', dayNum: 5 },
    { key: 'saturday', label: 'Samstag', dayNum: 6 },
    { key: 'sunday', label: 'Sonntag', dayNum: 0 },
]

function EventForm({ event, onClose, onSave }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#dc2626')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Einzeltermin
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('00:00')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('23:59')

    // Wiederkehrend
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurringStart, setRecurringStart] = useState('')
    const [recurringEnd, setRecurringEnd] = useState('')
    const [selectedDays, setSelectedDays] = useState({})

    useEffect(() => {
        if (event) {
            setTitle(event.title)
            setDescription(event.description || '')
            const start = new Date(event.startDate)
            const end = new Date(event.endDate)
            setStartDate(start.toISOString().split('T')[0])
            setStartTime(start.toTimeString().slice(0, 5))
            setEndDate(end.toISOString().split('T')[0])
            setEndTime(end.toTimeString().slice(0, 5))
            setColor(event.color)
        }
    }, [event])

    const toggleDay = (key) => {
        setSelectedDays(prev => {
            if (prev[key]) {
                const { [key]: _, ...rest } = prev
                return rest
            } else {
                return { ...prev, [key]: { start: '10:00', end: '12:00' } }
            }
        })
    }

    const updateDayTime = (key, field, value) => {
        setSelectedDays(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isRecurring) {
                // Wiederkehrende Termine
                if (!recurringStart || !recurringEnd) {
                    throw new Error('Zeitraum für wiederkehrende Termine erforderlich')
                }
                if (Object.keys(selectedDays).length === 0) {
                    throw new Error('Mindestens einen Wochentag auswählen')
                }

                // Konvertiere die Zeiten zu ISO-Strings (gleiche Logik wie bei Einzelterminen)
                const convertedDays = {}
                for (const [dayKey, times] of Object.entries(selectedDays)) {
                    // Dummy-Datum für Zeitkonvertierung (wird auf dem Server ersetzt)
                    const dummyDate = '2024-01-01'
                    const nextDay = '2024-01-02'
                    const startDT = new Date(`${dummyDate}T${times.start}`)
                    // Wenn Endzeit vor Startzeit liegt (z.B. 23:00-01:00), endet der Termin am nächsten Tag
                    const endsNextDay = times.end < times.start
                    const endDT = new Date(`${endsNextDay ? nextDay : dummyDate}T${times.end}`)
                    convertedDays[dayKey] = {
                        startISO: startDT.toISOString(),
                        endISO: endDT.toISOString(),
                        endsNextDay: endsNextDay
                    }
                }

                const res = await fetch('/api/events/recurring', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title,
                        description: description || null,
                        color,
                        recurringStart,
                        recurringEnd,
                        days: convertedDays
                    })
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')
            } else {
                // Einzeltermin
                const startDateTime = new Date(`${startDate}T${startTime}`)
                const endDateTime = new Date(`${endDate}T${endTime}`)

                if (endDateTime < startDateTime) {
                    throw new Error('Ende darf nicht vor dem Start liegen')
                }

                const url = event ? `/api/events/${event.id}` : '/api/events'
                const method = event ? 'PUT' : 'POST'

                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title,
                        description: description || null,
                        startDate: startDateTime.toISOString(),
                        endDate: endDateTime.toISOString(),
                        color
                    })
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')
            }

            onSave()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const colorOptions = [
        '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
        '#0891b2', '#2563eb', '#7c3aed', '#db2777',
    ]

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-2xl border border-gray-700 my-8"
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">Titel *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                            placeholder="Event Titel"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none"
                            placeholder="Optionale Beschreibung"
                        />
                    </div>

                    {/* Wiederkehrend Toggle - nur bei neuem Event */}
                    {!event && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${isRecurring ? 'bg-primary-600' : 'bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isRecurring ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className="text-gray-300">Wiederkehrender Termin</span>
                        </div>
                    )}

                    {isRecurring && !event ? (
                        <>
                            {/* Zeitraum */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Von Datum *</label>
                                    <input
                                        type="date"
                                        value={recurringStart}
                                        onChange={(e) => setRecurringStart(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Bis Datum *</label>
                                    <input
                                        type="date"
                                        value={recurringEnd}
                                        onChange={(e) => setRecurringEnd(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Wochentage */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">Wochentage *</label>
                                <div className="space-y-3">
                                    {WEEKDAYS.map(day => (
                                        <div key={day.key} className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleDay(day.key)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[100px] ${selectedDays[day.key]
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                            {selectedDays[day.key] && (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="time"
                                                        value={selectedDays[day.key].start}
                                                        onChange={(e) => updateDayTime(day.key, 'start', e.target.value)}
                                                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                    <span className="text-gray-400">bis</span>
                                                    <input
                                                        type="time"
                                                        value={selectedDays[day.key].end}
                                                        onChange={(e) => updateDayTime(day.key, 'end', e.target.value)}
                                                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Einzeltermin */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Startdatum *</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Startzeit *</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Enddatum *</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Endzeit *</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Farbe */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Farbe</label>
                        <div className="flex gap-2 flex-wrap">
                            {colorOptions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
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
