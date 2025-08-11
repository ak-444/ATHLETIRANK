import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Homepage from './pages/HomePage';
import RegisterAndLoginPage from './pages/RegisterLogin_Page';
import AdminDashboard from './pages/Admin/Admin_Dashboard';
import AdminEvents from './pages/Admin/Admin_Events';
import BracketsPage from './pages/Admin/Admin_Brackets';
import SchedulesPage from './pages/Admin/Admin_Schedules';
import SideBar from './components/sidebar';
import TeamsPage from './pages/Admin/Admin_Teams';
import AdminStats from './pages/Admin/Admin_Stats';
import AdminUsers from './pages/Admin/Admin_Users';
import StaffDashboard from './pages/Staff/Staff_Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

import './style/app.css';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <AuthProvider>
           <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Homepage />} />
                    <Route path="/Register&Login" element={<RegisterAndLoginPage />} />

                    {/* Admin protected routes */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                        <Route path="/AdminDashboard" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                                    <AdminDashboard sidebarOpen={sidebarOpen}/> 
                                </>
                            } />
                        
                        <Route path="/AdminDashboard/events" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                                    <AdminEvents sidebarOpen={sidebarOpen}/> 
                                </>
                            }
                        />

                        <Route path="/AdminDashboard/brackets" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                                    <BracketsPage sidebarOpen={sidebarOpen}/>
                                </>
                            }/>

                        <Route path="/AdminDashboard/schedules" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                                    <SchedulesPage sidebarOpen={sidebarOpen} />
                                </>
                            }/>

                        <Route path="/AdminDashboard/teams" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                                    <TeamsPage sidebarOpen={sidebarOpen} /> 
                                </>
                            }/>

                        <Route path="/AdminDashboard/stats" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                                    <AdminStats sidebarOpen={sidebarOpen} /> 
                                </>
                            }/>

                        <Route path="/AdminDashboard/users" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar}/>
                                    <AdminUsers sidebarOpen={sidebarOpen} /> 
                                </>
                            }/>
                    </Route>

                    {/* Staff protected routes */}
                    <Route element={<ProtectedRoute requiredRole="staff" />}>
                        <Route path="/StaffDashboard" 
                            element={
                                <>
                                    <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                                    <StaffDashboard sidebarOpen={sidebarOpen}/> 
                                </>
                            }/>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;