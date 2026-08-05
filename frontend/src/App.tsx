import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import BouncerConsole from './components/BouncerConsole';
import RetrieveTicket from './components/RetrieveTicket';
import TicketView from './components/TicketView';
import PaymentStatus from './components/PaymentStatus';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/bouncer" element={<BouncerConsole />} />
        <Route path="/retrieve" element={<RetrieveTicket />} />
        <Route path="/ticket/:ticketCode" element={<TicketView />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
      </Routes>
    </Router>
  );
}

export default App;
