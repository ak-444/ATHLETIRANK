
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../style/Admin_EventDetails.css";

const EventDetails = ({ sidebarOpen }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bracketsLoading, setBracketsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const url = `http://localhost:5000/api/events/${id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Fetch event brackets
  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        setBracketsLoading(true);
        const url = `http://localhost:5000/api/events/${id}/brackets`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setBrackets(data);
      } catch (err) {
        console.error("Error fetching brackets:", err);
        setBrackets([]);
      } finally {
        setBracketsLoading(false);
      }
    };

    if (id) {
      fetchBrackets();
    }
  }, [id]);

  const handleViewBracket = (bracket) => {
    navigate(`/AdminDashboard/brackets/${bracket.id}`, { 
        state: { event, bracket } 
    });
    };

  const getStatusBadge = (status) => {
    const statusClasses = {
      ongoing: "status-ongoing",
      completed: "status-completed"
    };
    return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
  };

  const getArchivedBadge = (archived) => {
    const archivedClasses = {
      no: "archived-no",
      yes: "archived-yes"
    };
    return <span className={`archived-badge ${archivedClasses[archived] || ''}`}>{archived}</span>;
  };

  if (loading) return (
    <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="loading-container">
        <p>Loading event details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="error-container">
        <p style={{ color: "red" }}>Error: {error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    </div>
  );

  if (!event) return (
    <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="error-container">
        <p>No event found.</p>
        <button onClick={() => navigate(-1)} className="back-button">
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <button onClick={() => navigate(-1)} className="back-button">
                ← Back to Events
              </button>
              <h1>Event Details</h1>
              <p>Manage event information and brackets</p>
            </div>
            <div className="header-right">
              <button className="create-bracket-btn">
                Create New Bracket
              </button>
            </div>
          </div>
        </div>

        {/* Event Information Card */}
        <div className="event-details-section">
          <div className="event-info-card">
            <div className="card-header">
              <h2>{event.name}</h2>
              <div className="event-badges">
                {getStatusBadge(event.status)}
                {getArchivedBadge(event.archived)}
              </div>
            </div>
            
            <div className="event-info-grid">
              <div className="info-item">
                <span className="info-label">Event ID:</span>
                <span className="info-value">#{event.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Start Date:</span>
                <span className="info-value">{new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">End Date:</span>
                <span className="info-value">{new Date(event.end_date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration:</span>
                <span className="info-value">
                  {Math.ceil((new Date(event.end_date) - new Date(event.start_date)) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brackets Section */}
        <div className="brackets-section">
          <div className="section-header">
            <h3>Tournament Brackets</h3>
            <span className="brackets-count">
              {brackets.length} bracket{brackets.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {bracketsLoading ? (
            <div className="loading-container">
              <p>Loading brackets...</p>
            </div>
          ) : brackets.length === 0 ? (
            <div className="no-brackets">
              <div className="empty-state">
                <h4>No Brackets Created</h4>
                <p>This event doesn't have any tournament brackets yet.</p>
                <button className="create-bracket-btn">
                  Create First Bracket
                </button>
              </div>
            </div>
          ) : (
            <div className="brackets-grid">
              {brackets.map((bracket) => (
                <div key={bracket.id} className="bracket-card">
                  <div className="bracket-header">
                    <h4>{bracket.name}</h4>
                    <span className="bracket-id">#{bracket.id}</span>
                  </div>
                  
                  <div className="bracket-info">
                    <div className="bracket-detail">
                      <span className="detail-label">Sport:</span>
                      <span className="detail-value sport-badge">{bracket.sport_type}</span>
                    </div>
                    <div className="bracket-detail">
                      <span className="detail-label">Format:</span>
                      <span className="detail-value format-badge">
                        {bracket.elimination_type === 'single' ? 'Single Elimination' : 'Double Elimination'}
                      </span>
                    </div>
                    <div className="bracket-detail">
                      <span className="detail-label">Teams:</span>
                      <span className="detail-value teams-count">{bracket.team_count || 0}</span>
                    </div>
                    <div className="bracket-detail">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{new Date(bracket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="bracket-actions">
                    <button 
                      className="view-bracket-btn"
                      onClick={() => handleViewBracket(bracket)}
                    >
                      View Bracket
                    </button>
                    <button className="edit-bracket-btn">
                      Edit
                    </button>
                    <button className="delete-bracket-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;