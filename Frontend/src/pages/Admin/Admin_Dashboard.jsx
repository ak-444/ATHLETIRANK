

import "../../style/Admin_Dashboard.css";

const AdminDashboard = ({sidebarOpen}) => {
  return (
    <div className="admin-dashboard">
      
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome to your admin panel</p>
        </div>
        
        <div className="dashboard-main">
          <div className="content-placeholder">
            <h2>Dashboard Content</h2>
            <p>This is where your main dashboard content will go.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;