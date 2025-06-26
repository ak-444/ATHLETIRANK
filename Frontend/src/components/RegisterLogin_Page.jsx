import { useState } from "react";
import Login from './Login';
import Register from './Register';
import '../style/RegisterAndLogin.css'

export default function RegisterAndLoginPage() {
    const [currentView, setCurrentView] = useState('login');
    
    

    return (
        <div className="app-container">
            {currentView === "register" && <Register setCurrentView={setCurrentView} />}
            {currentView === "login" && <Login setCurrentView={setCurrentView} />}
        </div>

    );
}