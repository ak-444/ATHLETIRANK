// RegisterLogin_Page

import { useState } from "react";
import { Link } from "react-router-dom"; // Import Link component
import Login from "../components/Login"
import Register from "../components/Register"
import '../style/RegisterAndLogin.css'

export default function RegisterAndLoginPage() {
    const [currentView, setCurrentView] = useState('login');
    
    return (
        <div className="app-container">
            {/* Add a back button to homepage */}
            <Link 
                to="/" 
                className="back-to-home-btn"
            >
                ← Back to Home
            </Link>
            
            {currentView === "register" && <Register setCurrentView={setCurrentView} />}
            {currentView === "login" && <Login setCurrentView={setCurrentView} />}
        </div>
    );
}