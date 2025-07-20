

const AdminStats = ({sidebarOpen}) => {
  return (
    <div className="admin-dashboard">
      
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Admin Stats</h1>
          <p>Welcome to your admin panel</p>
        </div>
        
        <div className="dashboard-main">
          <div className="content-placeholder">
            <h2>Stats Content</h2>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;