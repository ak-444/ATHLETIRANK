// import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './style/app.css';
import Homepage from './components/HomePage';
import RegisterAndLoginPage from './components/RegisterLogin_Page';

function AppContent() {
     
}

function App() {
    return (
        <AuthProvider>
           <Router>
                <Routes>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/RegisterLogin" element={<RegisterAndLoginPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;