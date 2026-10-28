import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import MyBookings from './pages/MyBookings';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/show/:id" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
          <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/confirmation/:id" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
          <Route path="*" element={<p className="text-center text-muted py-5">Page not found.</p>} />
        </Routes>
      </main>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
}
