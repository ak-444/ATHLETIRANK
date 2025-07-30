import "../../style/Admin_Dashboard.css";

const StaffDashboard = ({sidebarOpen}) => {
  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Staff Dashboard</h1>
          <p>Welcome to your staff panel</p>
        </div>
        
        <div className="dashboard-main">
          <div className="content-placeholder">
            <h2>Staff Dashboard Content</h2>
            <p>This is where your staff dashboard content will go.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;