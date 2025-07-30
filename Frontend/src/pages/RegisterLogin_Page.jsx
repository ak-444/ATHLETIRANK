// RegisterLogin_Page

import { useState } from "react";
import Login from "../components/Login"
import Register from "../components/Register"
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