import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Homepage from './pages/HomePage';
import RegisterAndLoginPage from './pages/RegisterLogin_Page';
import AdminDashboard from './pages/Admin/Admin_Dashboard';
import BracketsPage from './pages/Admin/Admin_Brackets';
import SchedulesPage from './pages/Admin/Admin_Schedules';
import SideBar from './components/sidebar';
import TeamsPage from './pages/Admin/Admin_Teams';
import AdminStats from './pages/Admin/Admin_Stats';
import AdminUsers from './pages/Admin/Admin_Users';

import './style/app.css';



function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <AuthProvider>
           <Router>
                <Routes>
                    {/*Viewer*/}
                    <Route path="/" element={<Homepage />} />
                    <Route path="/Register&Login" element={<RegisterAndLoginPage />} />

                    {/*Admin*/}
                    {/*Admin - Dashboard*/}
                    <Route path="/AdminDashboard" 
                    element={
                        <>
                            <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                            <AdminDashboard sidebarOpen={sidebarOpen}/> 
                        </>
                    }/>

                    {/*Admin - Brackets*/}
                    <Route path="/AdminDashboard/brackets" 

                    element={
                        <>
                            <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                            <BracketsPage sidebarOpen={sidebarOpen}/>
                        </>
                    }/>

                     {/*Admin - Schedules*/}
                    <Route path="/AdminDashboard/schedules" 
                    
                    element={
                        <>
                            <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                            <SchedulesPage sidebarOpen={sidebarOpen} />
                        </>
                    }/>

                     {/*Admin - Teams*/}
                    <Route path="/AdminDashboard/teams" 
                    element={
                        <>
                             <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                             <TeamsPage sidebarOpen={sidebarOpen} /> 
                        </>
                    }/>

                    {/*Admin - Stats*/}
                    <Route path="/AdminDashboard/stats" 
                    element={
                        <>
                             <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                             <AdminStats sidebarOpen={sidebarOpen} /> 
                        </>
                    }/>

                    {/*Admin - Users*/}
                    <Route path="/AdminDashboard/users" 
                    element={
                        <>
                             <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                             <AdminUsers sidebarOpen={sidebarOpen} /> 
                        </>
                    }/>

                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;