import { Routes, Route } from 'react-router-dom'
import Calendar from './pages/Calendar'
import Admin from './pages/Admin'

function App() {
    return (
        <div className="min-h-screen bg-gray-900">
            <Routes>
                <Route path="/" element={<Calendar />} />
                <Route path="/admin/*" element={<Admin />} />
            </Routes>
        </div>
    )
}

export default App
