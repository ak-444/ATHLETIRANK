

const AdminUsers = ({sidebarOpen}) => {
  return (
    <div className="admin-dashboard">
      
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Admin Users Management</h1>
          <p>Welcome to your admin panel</p>
        </div>
        
        <div className="dashboard-main">
          <div className="content-placeholder">
            <h2>Users Content</h2>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;