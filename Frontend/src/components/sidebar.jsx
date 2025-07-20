import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../style/sidebar.css";

/*Sa icon to pre*/
import { IoIosHome } from "react-icons/io";
import { TbTournament } from "react-icons/tb";
import { AiFillSchedule } from "react-icons/ai";
import { RiTeamFill } from "react-icons/ri";
import { IoStatsChart } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import { RiLogoutCircleLine } from "react-icons/ri"
import { FaUser } from "react-icons/fa";

const SideBar = ({ isOpen, toggleSidebar }) => {
  
  const navigate = useNavigate();
  const location = useLocation();


  const handleLogout = () => {
    // Add your logout logic here
    console.log("Logging out...");
    navigate("/");
  };

  const menuItems = [
    { icon: <IoIosHome />, label: "Dashboard", id: "dashboard", path: "/AdminDashboard" },
    { icon: <TbTournament />, label: "Brackets", id: "bracket", path: "/AdminDashboard/brackets" },
    { icon: <AiFillSchedule />, label: "Schedules", id: "schedule", path: "/AdminDashboard/schedules" },
    { icon: <RiTeamFill />, label: "Teams", id: "teams", path: "/AdminDashboard/teams" },
    { icon: <IoStatsChart />, label: "Stats", id: "stats", path: "/AdminDashboard/stats" },
    { icon: <HiUsers />, label: "Users", id: "users", path: "/AdminDashboard/users" },
  ];

  return (
  <div className="sidebar-container">
    {/* Toggle Button */}
    <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
      {isOpen ? "<" : ">"}
    </button>

    {/* Sidebar */}
    <div className={`sidebar-content ${isOpen ?  "sidebar-open": "sidebar-closed"}`}>
      
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user-profile">
          <div className="sidebar-user-avatar"><FaUser /></div>
          {isOpen && (
            <div className="sidebar-user-info">User Profile</div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar-nav-item">

              <Link to={item.path}  className={`sidebar-nav-link ${location.pathname === item.path ? 'active' : ''}`}>

                <span className="sidebar-nav-icon">{item.icon}</span>
                {isOpen && (
                  <span className="sidebar-nav-label">{item.label}</span>
                )}
                
              </Link>

            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-nav-link logout-link">

          <span className="sidebar-nav-icon"><RiLogoutCircleLine /></span>
          {isOpen && <span className="sidebar-nav-label">Log Out</span>}
        </button>
      </div>

    </div>

    {/* Overlay */}
    {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
  </div>
);
};

export default SideBar;