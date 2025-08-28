import React, { useState, useEffect } from "react";
import "../../style/Staff_SchedulePage.css";

const StaffSchedulePage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [schedules, setSchedules] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterEvent, setFilterEvent] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock current user - in real app, this would come from auth context
  useEffect(() => {
    setCurrentUser({
      id: 1,
      name: "John Smith",
      email: "john.smith@tournament.com",
      role: "staff"
    });
  }, []);

  // Mock data - in real app, this would come from your API
  useEffect(() => {
    const mockSchedules = [
      {
        id: 1,
        eventId: 1,
        eventName: "Spring Basketball Tournament 2024",
        bracketId: 1,
        bracketName: "Men's Division A",
        round: "Quarterfinals",
        teamA: "Lakers",
        teamB: "Warriors",
        date: "2024-03-15",
        time: "14:00",
        venue: "Main Arena",
        description: "Championship quarterfinal match",
        assignedStaff: [1, 2], // Staff IDs assigned to this game
        createdAt: "2024-02-20"
      },
      {
        id: 2,
        eventId: 1,
        eventName: "Spring Basketball Tournament 2024",
        bracketId: 2,
        bracketName: "Women's Division A",
        round: "Semifinals",
        teamA: "Phoenix",
        teamB: "Storm",
        date: "2024-03-16",
        time: "16:30",
        venue: "Court 2",
        description: "Women's semifinal showdown",
        assignedStaff: [2, 3],
        createdAt: "2024-02-21"
      },
      {
        id: 3,
        eventId: 2,
        eventName: "Football Championship 2024",
        bracketId: 3,
        bracketName: "Premier League",
        round: "Finals",
        teamA: "Eagles",
        teamB: "Hawks",
        date: "2024-03-20",
        time: "19:00",
        venue: "Stadium A",
        description: "Championship final",
        assignedStaff: [1, 3, 4],
        createdAt: "2024-02-22"
      },
      {
        id: 4,
        eventId: 1,
        eventName: "Spring Basketball Tournament 2024",
        bracketId: 1,
        bracketName: "Men's Division A",
        round: "Finals",
        teamA: "Celtics",
        teamB: "Heat",
        date: "2024-03-18",
        time: "20:00",
        venue: "Main Arena",
        description: "Championship final game",
        assignedStaff: [1, 2, 3],
        createdAt: "2024-02-23"
      }
    ];

    const mockEvents = [
      { id: 1, name: "Spring Basketball Tournament 2024" },
      { id: 2, name: "Football Championship 2024" }
    ];

    setSchedules(mockSchedules);
    setEvents(mockEvents);

    // Filter schedules assigned to current user
    if (currentUser) {
      const userSchedules = mockSchedules.filter(schedule => 
        schedule.assignedStaff.includes(currentUser.id)
      );
      setMySchedules(userSchedules);
    }
  }, [currentUser]);

  const handleClearFilters = () => {
    setFilterEvent("");
    setFilterDate("");
    setSearchTerm("");
  };

  const getFilteredSchedules = (schedulesToFilter) => {
    return schedulesToFilter.filter(schedule => {
      const matchesEvent = !filterEvent || schedule.eventId === parseInt(filterEvent);
      const matchesDate = !filterDate || schedule.date === filterDate;
      const matchesSearch = !searchTerm || 
        schedule.teamA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.teamB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.round.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesEvent && matchesDate && matchesSearch;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isUpcoming = (date, time) => {
    const gameDateTime = new Date(`${date}T${time}`);
    return gameDateTime > new Date();
  };

  const getStatusBadge = (date, time) => {
    const gameDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffHours = (gameDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return <span className="status-badge completed">Completed</span>;
    } else if (diffHours <= 2) {
      return <span className="status-badge upcoming-soon">Starting Soon</span>;
    } else if (diffHours <= 24) {
      return <span className="status-badge upcoming-today">Today</span>;
    } else {
      return <span className="status-badge upcoming">Upcoming</span>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Schedule </h1>
          <p>View tournament schedules and your assigned games</p>
        </div>

        <div className="schedule-content">
          {/* Tabs */}
          <div className="schedule-tabs">
            <button 
              className={`schedule-tab-button ${activeTab === "all" ? "schedule-tab-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Schedules ({schedules.length})
            </button>
            <button 
              className={`schedule-tab-button ${activeTab === "assigned" ? "schedule-tab-active" : ""}`}
              onClick={() => setActiveTab("assigned")}
            >
              My Assignments ({mySchedules.length})
            </button>
          </div>

          {/* Filters */}
          <div className="schedule-filters">
            <div className="filter-group">
              <label>Filter by Event:</label>
              <select 
                value={filterEvent} 
                onChange={(e) => setFilterEvent(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Filter by Date:</label>
              <input 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Search:</label>
              <input 
                type="text" 
                placeholder="Search teams, venue, or round..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button className="clear-filters-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>

          {/* Schedule Grid */}
          <div className="schedule-view-section">
            {activeTab === "all" ? (
              <>
                <h2>All Tournament Schedules</h2>
                {getFilteredSchedules(schedules).length === 0 ? (
                  <div className="schedule-no-schedules">
                    <p>No schedules found matching your filters.</p>
                  </div>
                ) : (
                  <div className="schedule-grid">
                    {getFilteredSchedules(schedules).map((schedule) => (
                      <div key={schedule.id} className="schedule-card">
                        <div className="schedule-card-header">
                          <h3>{schedule.teamA} vs {schedule.teamB}</h3>
                          <div className="schedule-status">
                            {getStatusBadge(schedule.date, schedule.time)}
                          </div>
                        </div>
                        
                        <div className="schedule-card-info">
                          <div className="info-row">
                            <strong>Event:</strong> {schedule.eventName}
                          </div>
                          <div className="info-row">
                            <strong>Bracket:</strong> {schedule.bracketName}
                          </div>
                          <div className="info-row">
                            <strong>Round:</strong> {schedule.round}
                          </div>
                          <div className="info-row">
                            <strong>Date:</strong> {formatDate(schedule.date)}
                          </div>
                          <div className="info-row">
                            <strong>Time:</strong> {formatTime(schedule.time)}
                          </div>
                          <div className="info-row">
                            <strong>Venue:</strong> {schedule.venue}
                          </div>
                          {schedule.description && (
                            <div className="info-row description">
                              <strong>Description:</strong> {schedule.description}
                            </div>
                          )}
                        </div>

                        {schedule.assignedStaff.includes(currentUser?.id) && (
                          <div className="assignment-badge">
                            <span>✓ You are assigned to this game</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>My Assigned Games</h2>
                {getFilteredSchedules(mySchedules).length === 0 ? (
                  <div className="schedule-no-schedules">
                    <p>No assigned games found matching your filters.</p>
                  </div>
                ) : (
                  <div className="schedule-grid">
                    {getFilteredSchedules(mySchedules).map((schedule) => (
                      <div key={schedule.id} className="schedule-card assigned-card">
                        <div className="schedule-card-header">
                          <h3>{schedule.teamA} vs {schedule.teamB}</h3>
                          <div className="schedule-status">
                            {getStatusBadge(schedule.date, schedule.time)}
                          </div>
                        </div>
                        
                        <div className="schedule-card-info">
                          <div className="info-row">
                            <strong>Event:</strong> {schedule.eventName}
                          </div>
                          <div className="info-row">
                            <strong>Bracket:</strong> {schedule.bracketName}
                          </div>
                          <div className="info-row">
                            <strong>Round:</strong> {schedule.round}
                          </div>
                          <div className="info-row">
                            <strong>Date:</strong> {formatDate(schedule.date)}
                          </div>
                          <div className="info-row">
                            <strong>Time:</strong> {formatTime(schedule.time)}
                          </div>
                          <div className="info-row">
                            <strong>Venue:</strong> {schedule.venue}
                          </div>
                          {schedule.description && (
                            <div className="info-row description">
                              <strong>Description:</strong> {schedule.description}
                            </div>
                          )}
                        </div>

                        <div className="assignment-actions">
                          {isUpcoming(schedule.date, schedule.time) ? (
                            <div className="upcoming-game-info">
                              <span>🕐 Prepare for this game</span>
                            </div>
                          ) : (
                            <div className="completed-game-info">
                              <span>✅ Game completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSchedulePage;