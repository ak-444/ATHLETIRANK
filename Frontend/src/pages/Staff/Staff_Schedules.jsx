import React, { useState, useEffect } from "react";
import "../../style/Staff_SchedulePage.css";

const StaffSchedulePage = ({ sidebarOpen }) => {
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Format round display based on bracket type and round number
  const formatRoundDisplay = (schedule) => {
    if (!schedule || !schedule.round_number) return "Unknown Round";
    
    const roundNum = schedule.round_number;
    const bracketType = schedule.bracket_type;
    
    if (roundNum === 200) return 'Grand Final';
    if (roundNum === 201) return 'Bracket Reset';
    if (roundNum >= 200 && bracketType === 'championship') {
      return `Championship Round ${roundNum - 199}`;
    }
    
    if (bracketType === 'loser' || (roundNum >= 101 && roundNum < 200)) {
      return `LB Round ${roundNum - 100}`;
    }
    
    if (bracketType === 'winner' || roundNum < 100) {
      return `Round ${roundNum}`;
    }
    
    return `Round ${roundNum}`;
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsRes, schedulesRes] = await Promise.all([
        fetch("http://localhost:5000/api/events").then(res => {
          if (!res.ok) throw new Error('Failed to fetch events');
          return res.json();
        }),
        fetch("http://localhost:5000/api/schedules").then(res => {
          if (!res.ok) throw new Error('Failed to fetch schedules');
          return res.json();
        })
      ]);

      setEvents(eventsRes);
      setSchedules(schedulesRes);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClearFilters = () => {
    setFilterEvent("");
    setFilterDate("");
  };

  // Get filtered schedules
  const getFilteredSchedules = () => {
    return schedules.filter(schedule => {
      const matchesEvent = !filterEvent || schedule.event_id === parseInt(filterEvent);
      const matchesDate = !filterDate || schedule.date === filterDate;
      
      return matchesEvent && matchesDate;
    });
  };

  const formatScheduleDateTime = (date, time) => {
    if (!date || !time) return 'Date TBD';
    
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');
    
    const dateObj = new Date(year, month - 1, day, hours, minutes);
    
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  const filteredSchedules = getFilteredSchedules();

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="dashboard-header">
            <h1>Schedules</h1>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Schedules</h1>
          <p>View tournament schedules</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="dashboard-main">
          <div className="bracket-content">
            {/* Filters Section */}
            <div className="bracket-filters-section">
              <h3>Filter Schedules</h3>
              <div className="bracket-filters">
                <div className="filter-group">
                  <label htmlFor="filterEvent">Event:</label>
                  <select
                    id="filterEvent"
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
                  >
                    <option value="">All Events</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="filterDate">Date:</label>
                  <input
                    type="date"
                    id="filterDate"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <button className="clear-filters-btn" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* View Schedules */}
            <div className="bracket-view-section">
              <h2>All Schedules</h2>
              {filteredSchedules.length === 0 ? (
                <div className="bracket-no-brackets">
                  <p>No schedules found.</p>
                </div>
              ) : (
                <div className="bracket-grid">
                  {filteredSchedules.map((schedule) => (
                    <div key={schedule.id} className="bracket-card schedule-card">
                      <div className="bracket-card-header">
                        <h3>
                          {schedule.team1_name && schedule.team2_name 
                            ? `${schedule.team1_name} vs ${schedule.team2_name}`
                            : "Match Details TBD"
                          }
                        </h3>
                        <span className={`bracket-sport-badge bracket-sport-${schedule.sport_type || "default"}`}>
                          {schedule.sport_type ? capitalize(schedule.sport_type) : "Unknown"}
                        </span>
                      </div>
                      <div className="bracket-card-info">
                        <div><strong>Event:</strong> {schedule.event_name || "Unknown"}</div>
                        <div><strong>Bracket:</strong> {schedule.bracket_name || "Unknown"}</div>
                        {schedule.round_number && (
                          <div><strong>Round:</strong> {formatRoundDisplay(schedule)}</div>
                        )}
                        <div><strong>Date & Time:</strong> {formatScheduleDateTime(schedule.date, schedule.time)}</div>
                        <div><strong>Venue:</strong> {schedule.venue}</div>
                        {schedule.description && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                            <strong>Notes:</strong> {schedule.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSchedulePage;