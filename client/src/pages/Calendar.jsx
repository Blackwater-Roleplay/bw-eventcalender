import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import deLocale from '@fullcalendar/core/locales/de'

function Calendar() {
    const [events, setEvents] = useState([])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events')
            const data = await res.json()
            const formattedEvents = data.map(event => ({
                id: event.id,
                title: event.title,
                start: event.startDate,
                end: event.endDate,
                backgroundColor: event.color,
                borderColor: event.color,
                extendedProps: {
                    description: event.description
                }
            }))
            setEvents(formattedEvents)
        } catch (error) {
            console.error('Fehler beim Laden der Events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEventClick = (info) => {
        setSelectedEvent({
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            description: info.event.extendedProps.description
        })
    }

    const formatDate = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (date) => {
        if (!date) return ''
        return new Date(date).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4 md:p-6">
            <header className="mb-6 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                    <span className="text-primary-500">Event</span> Kalender
                </h1>
            </header>

            <div className="max-w-screen-2xl mx-auto bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                ) : (
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        eventClick={handleEventClick}
                        locale={deLocale}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek'
                        }}
                        height="auto"
                        fixedWeekCount={false}
                        eventDisplay="block"
                        displayEventTime={true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }}
                        dayMaxEvents={4}
                        moreLinkText={(num) => `+${num} mehr`}
                        eventContent={(eventInfo) => {
                            const start = eventInfo.event.start
                            const end = eventInfo.event.end
                            const formatT = (d) => d ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''
                            const startTime = formatT(start)
                            const endTime = formatT(end)
                            const timeRange = endTime ? `${startTime} - ${endTime}` : startTime
                            
                            return (
                                <div className="p-1 overflow-hidden">
                                    <div className="font-semibold text-xs">
                                        {timeRange}
                                    </div>
                                    <div className="text-xs truncate">
                                        {eventInfo.event.title}
                                    </div>
                                </div>
                            )
                        }}
                    />
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">{selectedEvent.title}</h2>

                        <div className="space-y-3 text-gray-300">
                            <div>
                                <span className="text-primary-400 font-semibold">Start:</span>
                                <p>{formatDate(selectedEvent.start)} um {formatTime(selectedEvent.start)} Uhr</p>
                            </div>

                            <div>
                                <span className="text-primary-400 font-semibold">Ende:</span>
                                <p>{formatDate(selectedEvent.end)} um {formatTime(selectedEvent.end)} Uhr</p>
                            </div>

                            {selectedEvent.description && (
                                <div>
                                    <span className="text-primary-400 font-semibold">Beschreibung:</span>
                                    <p className="mt-1">{selectedEvent.description}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Schließen
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Calendar
