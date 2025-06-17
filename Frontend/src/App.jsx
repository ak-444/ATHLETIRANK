import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ConnectionTest from './components/ConnectionTest';

function AppContent() {
    const [currentView, setCurrentView] = useState('test');
    const { user, logout, isAuthenticated } = useAuth();

    if (isAuthenticated && user) {
        return (
            <div>
                <div>
                    <div>
                        <h2>Welcome to ATHLETIRANK, {user.username}!</h2>
                        <p>Email: {user.email}</p>
                    </div>
                    <button onClick={logout}>
                        Logout
                    </button>
                </div>
                
                <ConnectionTest />
                
                <div>
                    <h3>🎉 Frontend-Backend Connection Successful!</h3>
                    <p>You are now logged in and connected to the backend.</p>
                    <p>You can now build your athlete ranking features!</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div>
                <h1>🏃‍♂️ ATHLETIRANK</h1>
                <nav>
                    <button onClick={() => setCurrentView('test')}>
                        Test Connection
                    </button>
                    <button onClick={() => setCurrentView('register')}>
                        Register
                    </button>
                    <button onClick={() => setCurrentView('login')}>
                        Login
                    </button>
                </nav>
            </div>

            {currentView === 'test' && <ConnectionTest />}
            {currentView === 'register' && <Register />}
            {currentView === 'login' && <Login />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;