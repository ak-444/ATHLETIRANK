import { useState } from "react";

import Login from "../components/Login"
import Register from "../components/Register"
import Athletirank_Logo from '../assets/Athletirank_Logo.png';
import '../style/RegisterAndLogin.css'

export default function RegisterAndLoginPage() {
    const [currentView, setCurrentView] = useState('login');
    
    return (
        <div className="register-login-page-reset"> {/* Add this wrapper */}
            <div className="app-container">
                
                
                
                <div className="split-layout">
                    {/* Left Side - Logo and Branding */}
                    <div className="left-section">
                        <div className="brand-container">
                            <img 
                                src={Athletirank_Logo} 
                                alt="Athletirank Logo" 
                                className="brand-logo"
                            />
                            <h1 className="brand-title">ATHLETIRANK</h1>
                          
                        </div>
                    </div>

                    {/* Right Side - Auth Forms */}
                    <div className="right-section">
                        {currentView === "register" && <Register setCurrentView={setCurrentView} />}
                        {currentView === "login" && <Login setCurrentView={setCurrentView} />}
                    </div>
                </div>
            </div>
        </div>
    );
}