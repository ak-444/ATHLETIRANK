import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import '../../style/admin_Users.css';
import { FaEye, FaCheck, FaTimes, FaTrash, FaDownload, FaBars, FaSearch } from 'react-icons/fa';

const AdminUsers = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setShowSearch(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user, filter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch users. Please try again.');
      setLoading(false);
      console.error('Error fetching users:', error);
    }
  };

  const approveUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/approve`);
      setSuccess('User approved successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to approve user.');
      console.error('Error approving user:', error);
    }
  };

  const rejectUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/reject`);
      setSuccess('User rejected successfully!');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to reject user.');
      console.error('Error rejecting user:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await API.delete(`/admin/users/${userId}`);
        setSuccess('User deleted successfully!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete user.');
        console.error('Error deleting user:', error);
      }
    }
  };

  const downloadId = (imagePath) => {
    window.open(`http://localhost:5000/uploads/${imagePath}`, '_blank');
  };

  const filteredUsers = users.filter(user => {
    // Apply filter
    if (filter === 'pending') return !user.is_approved;
    if (filter === 'approved') return user.is_approved;
    if (filter === 'staff') return user.role === 'staff';
    if (filter === 'admin') return user.role === 'admin';
    return true;
  }).filter(user => {
    // Apply search
    if (!searchTerm) return true;
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>User Management</h1>
          <p>Manage staff and admin accounts</p>
        </div>
        
        <div className="dashboard-main">
          {error && (
            <div className="alert alert-danger">
              {error}
              <button onClick={() => setError('')} className="close-btn">&times;</button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              {success}
              <button onClick={() => setSuccess('')} className="close-btn">&times;</button>
            </div>
          )}

          <div className="user-management-toolbar">
            <div className="filter-controls">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Users</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="staff">Staff Only</option>
                <option value="admin">Admins Only</option>
              </select>
              
              {isMobile ? (
                <div className="mobile-search-container">
                  <button 
                    className="mobile-search-toggle"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <FaSearch />
                  </button>
                  {showSearch && (
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input mobile-search-input"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="users-table-container">
              {isMobile ? (
                <div className="users-cards">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div key={user.id} className="user-card">
                        <div className="user-card-header">
                          <h3>{user.username}</h3>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                        <div className="user-card-details">
                          <p className="user-email">{user.email}</p>
                          <div className="user-status">
                            <span className={`status-badge ${user.is_approved ? 'approved' : 'pending'}`}>
                              {user.is_approved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <div className="user-id-verification">
                            {user.university_id_image ? (
                              <button 
                                onClick={() => downloadId(user.university_id_image)}
                                className="view-id-btn"
                              >
                                <FaEye /> View ID
                              </button>
                            ) : (
                              <span className="no-id">No ID uploaded</span>
                            )}
                          </div>
                        </div>
                        <div className="user-card-actions">
                          {!user.is_approved && (
                            <>
                              <button 
                                onClick={() => approveUser(user.id)}
                                className="approve-btn"
                                title="Approve"
                              >
                                <FaCheck />
                              </button>
                              <button 
                                onClick={() => rejectUser(user.id)}
                                className="reject-btn"
                                title="Reject"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="delete-btn"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-users">
                      No users found matching your criteria
                    </div>
                  )}
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>ID Verification</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${user.is_approved ? 'approved' : 'pending'}`}>
                              {user.is_approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            {user.university_id_image ? (
                              <button 
                                onClick={() => downloadId(user.university_id_image)}
                                className="view-id-btn"
                              >
                                <FaEye /> View ID
                              </button>
                            ) : (
                              <span className="no-id">No ID uploaded</span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {!user.is_approved && (
                                <>
                                  <button 
                                    onClick={() => approveUser(user.id)}
                                    className="approve-btn"
                                    title="Approve"
                                  >
                                    <FaCheck />
                                  </button>
                                  <button 
                                    onClick={() => rejectUser(user.id)}
                                    className="reject-btn"
                                    title="Reject"
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="delete-btn"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-users">
                          No users found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;