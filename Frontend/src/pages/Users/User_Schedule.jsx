import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/User_SchedulePage.css";
import { MdSchedule } from "react-icons/md";

const UserSchedulePage = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]); // Add teams state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [events, setEvents] = useState([]);

  // Available sports for filtering
  const sports = ["Basketball", "Volleyball"];

  // Handle back to homepage
  const handleBackToHome = () => {
    navigate("/");
  };

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

  // Format date and time for display
  const formatScheduleDateTime = (date, time) => {
    if (!date || !time) return 'Date TBD';
    
    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');
    
    const dateObj = new Date(year, month - 1, day, hours, minutes);
    
    return {
      full: dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      date: dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      shortDate: dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    };
  };

  // Fetch teams data to get win-loss records
  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/user-stats/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  // Fetch schedules and events on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [schedulesRes, eventsRes] = await Promise.all([
          fetch("http://localhost:5000/api/schedules"),
          fetch("http://localhost:5000/api/events")
        ]);
        
        const schedulesData = await schedulesRes.json();
        const eventsData = await eventsRes.json();
        
        setSchedules(schedulesData);
        setEvents(eventsData);
        
        // Fetch teams data for win-loss records
        await fetchTeams();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get team record by team name
  const getTeamRecord = (teamName) => {
    if (!teamName) return { wins: 0, losses: 0 };
    
    const team = teams.find(t => 
      t.name.toLowerCase() === teamName.toLowerCase()
    );
    
    return {
      wins: team?.wins || 0,
      losses: team?.losses || 0
    };
  };

  // Format team record for display
  const formatTeamRecord = (teamName) => {
    const record = getTeamRecord(teamName);
    return `(${record.wins} - ${record.losses})`;
  };

  // Filter schedules based on search, sport, and event selection
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      (schedule.team1_name && schedule.team1_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (schedule.team2_name && schedule.team2_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (schedule.event_name && schedule.event_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (schedule.venue && schedule.venue.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSport = selectedSport === "" || schedule.sport_type === selectedSport.toLowerCase();
    const matchesEvent = selectedEvent === "" || schedule.event_id === parseInt(selectedEvent);
    
    return matchesSearch && matchesSport && matchesEvent;
  });

  // Sort schedules by date and time
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA - dateB;
  });

  // Capitalize first letter
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  // Handle schedule detail view
  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleCloseModal = () => {
    setSelectedSchedule(null);
  };

  // Check if schedule is upcoming or past
  const getScheduleStatus = (date, time) => {
    const scheduleDateTime = new Date(`${date} ${time}`);
    const now = new Date();
    return scheduleDateTime > now ? 'upcoming' : 'past';
  };

  return (
    <div className="user-schedule-page">
      <div className="schedule-header">
        <div className="header-content">
          <div className="header-top">
            <button className="back-btn" onClick={handleBackToHome}>
              <span className="back-arrow">←</span>
              Back to Home
            </button>
          </div>
          
          <div className="header-title-section">
            <h1><MdSchedule className="header-icon"/>Match Schedule</h1>
            <p>View all upcoming and past tournament matches</p>
          </div>
        </div>
      </div>

      <div className="schedule-container">
        {/* Search and Filter Section */}
        <div className="schedule-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search teams, events, or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-section">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="event-filter"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="sport-filter"
            >
              <option value="">All Sports</option>
              {sports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedules Display */}
        <div className="schedule-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading schedules...</p>
            </div>
          ) : sortedSchedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No schedules found</h3>
              <p>
                {searchTerm || selectedSport || selectedEvent
                  ? "Try adjusting your search or filter criteria" 
                  : "No matches have been scheduled yet"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="schedule-stats">
                <span className="stats-text">
                  Showing {sortedSchedules.length} of {schedules.length} matches
                </span>
              </div>
              <div className="schedule-grid-new">
                {sortedSchedules.map(schedule => {
                  const dateTime = formatScheduleDateTime(schedule.date, schedule.time);
                  const status = getScheduleStatus(schedule.date, schedule.time);
                  
                  return (
                    <div key={schedule.id} className={`schedule-card-new ${status}`}>
                      <div className="schedule-card-header-new">
                        <div className="match-sport-info">
                          <span className="sport-type-new">{schedule.sport_type ? capitalize(schedule.sport_type) : "Unknown"}</span>
                          <span className={`status-badge-new ${status}`}>
                            {status === 'upcoming' ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>
                        <div className="match-date-new">
                          <span className="date-day">{dateTime.dayOfWeek}</span>
                          <span className="date-full">{dateTime.shortDate} • {dateTime.time}</span>
                        </div>
                      </div>
                      
                      <div className="schedule-card-body-new">
                        <div className="teams-container-new">
                          <div className="team-new">
                            <div className="team-name-new">{schedule.team1_name || "TBD"}</div>
                            <div className="team-record">
                              {formatTeamRecord(schedule.team1_name)}
                            </div>
                          </div>
                          
                          <div className="vs-section-new">
                            <span className="vs-text">vs</span>
                          </div>
                          
                          <div className="team-new">
                            <div className="team-name-new">{schedule.team2_name || "TBD"}</div>
                            <div className="team-record">
                              {formatTeamRecord(schedule.team2_name)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="match-details-new">
                          <div className="detail-row">
                            <span className="detail-icon">🏆</span>
                            <span className="detail-text">{schedule.event_name || "Unknown Event"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-icon">📍</span>
                            <span className="detail-text">{schedule.venue || "Venue TBD"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="schedule-card-footer-new">
                        <button 
                          className="view-schedule-btn-new"
                          onClick={() => handleViewSchedule(schedule)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Schedule Detail Modal - Updated with team records */}
      {selectedSchedule && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>Match Details</h2>
                <span className={`sport-badge sport-${selectedSchedule.sport_type || "default"}`}>
                  {selectedSchedule.sport_type ? capitalize(selectedSchedule.sport_type) : "Unknown"}
                </span>
              </div>
              <button className="close-btn" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="match-details">
                <div className="teams-display">
                  <div className="team-side">
                    <h3>{selectedSchedule.team1_name || "TBD"}</h3>
                    <div className="team-record-modal">
                      {formatTeamRecord(selectedSchedule.team1_name)}
                    </div>
                    <span className="team-label">Team 1</span>
                  </div>
                  <div className="vs-divider">VS</div>
                  <div className="team-side">
                    <h3>{selectedSchedule.team2_name || "TBD"}</h3>
                    <div className="team-record-modal">
                      {formatTeamRecord(selectedSchedule.team2_name)}
                    </div>
                    <span className="team-label">Team 2</span>
                  </div>
                </div>
                
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Event</span>
                    <span className="detail-value">{selectedSchedule.event_name || "Unknown"}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Bracket</span>
                    <span className="detail-value">{selectedSchedule.bracket_name || "Unknown"}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Round</span>
                    <span className="detail-value">{formatRoundDisplay(selectedSchedule)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Date & Time</span>
                    <span className="detail-value">
                      {formatScheduleDateTime(selectedSchedule.date, selectedSchedule.time).full}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Venue</span>
                    <span className="detail-value">{selectedSchedule.venue}</span>
                  </div>
                  
                  {selectedSchedule.description && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Additional Notes</span>
                      <span className="detail-value">{selectedSchedule.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSchedulePage;