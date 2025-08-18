import React, { useState, useEffect } from "react";
import "../../style/Admin_SchedulePage.css";

const SchedulesPage = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [schedules, setSchedules] = useState([]);
  const [events, setEvents] = useState([]);
  const [brackets, setBrackets] = useState([]);

  const [formData, setFormData] = useState({
    eventId: "",
    bracketId: "",
    round: "",
    teamA: "",
    teamB: "",
    date: "",
    time: "",
    venue: "",
    description: ""
  });

  // Fetch Events & Brackets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEvents = await fetch("http://localhost:5000/api/events");
        const resBrackets = await fetch("http://localhost:5000/api/brackets");
        const eventsData = await resEvents.json();
        const bracketsData = await resBrackets.json();
        setEvents(eventsData);
        setBrackets(bracketsData);
      } catch (err) {
        console.error("Error fetching events/brackets:", err);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "bracketId") {
      setFormData((prev) => ({
        ...prev,
        round: "",
        teamA: "",
        teamB: ""
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bracket = brackets.find(b => b.id === parseInt(formData.bracketId));
    if (!bracket) {
      alert("Please select a bracket");
      return;
    }

    const newSchedule = {
      id: Date.now(),
      eventId: formData.eventId,
      eventName: events.find(ev => ev.id === parseInt(formData.eventId))?.name || "",
      bracketId: bracket.id,
      bracketName: bracket.name,
      round: formData.round,
      teamA: formData.teamA,
      teamB: formData.teamB,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      description: formData.description,
      createdAt: new Date().toLocaleDateString()
    };

    setSchedules(prev => [...prev, newSchedule]);

    setFormData({
      eventId: "",
      bracketId: "",
      round: "",
      teamA: "",
      teamB: "",
      date: "",
      time: "",
      venue: "",
      description: ""
    });

    setActiveTab("view");
  };

  const handleDeleteSchedule = (id) => {
    setSchedules(prev => prev.filter(sch => sch.id !== id));
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Schedules Management</h1>
          <p>Create and manage tournament schedules</p>
        </div>

        <div className="schedule-content">
          {/* Tabs */}
          <div className="schedule-tabs">
            <button 
              className={`schedule-tab-button ${activeTab === "create" ? "schedule-tab-active" : ""}`}
              onClick={() => setActiveTab("create")}
            >
              Create Schedule
            </button>
            <button 
              className={`schedule-tab-button ${activeTab === "view" ? "schedule-tab-active" : ""}`}
              onClick={() => setActiveTab("view")}
            >
              View Schedules ({schedules.length})
            </button>
          </div>

          {/* Create Schedule */}
          {activeTab === "create" && (
            <div className="schedule-create-section">
              <div className="schedule-form-container">
                <h2>Create New Schedule</h2>
                <form className="schedule-form" onSubmit={handleSubmit}>
                  
                  {/* Event */}
                  <div className="schedule-form-group">
                    <label>Select Event *</label>
                    <select
                      name="eventId"
                      value={formData.eventId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choose an event</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bracket */}
                  <div className="schedule-form-group">
                    <label>Select Bracket *</label>
                    <select
                      name="bracketId"
                      value={formData.bracketId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choose a bracket</option>
                      {brackets
                        .filter(b => b.eventId === parseInt(formData.eventId))
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.sport})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Round */}
                  {formData.bracketId && (
                    <div className="schedule-form-group">
                      <label>Round *</label>
                      <select
                        name="round"
                        value={formData.round}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Choose round</option>
                        {brackets.find(b => b.id === parseInt(formData.bracketId))?.rounds.map(r => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Teams */}
                  {formData.bracketId && (
                    <>
                      <div className="schedule-form-group">
                        <label>Team A *</label>
                        <select
                          name="teamA"
                          value={formData.teamA}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Team A</option>
                          {brackets.find(b => b.id === parseInt(formData.bracketId))?.teams.map(team => (
                            <option key={team.name} value={team.name}>{team.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="schedule-form-group">
                        <label>Team B *</label>
                        <select
                          name="teamB"
                          value={formData.teamB}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Team B</option>
                          {brackets.find(b => b.id === parseInt(formData.bracketId))?.teams.map(team => (
                            <option key={team.name} value={team.name}>{team.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Date / Time / Venue */}
                  <div className="schedule-form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                  </div>

                  <div className="schedule-form-group">
                    <label>Time *</label>
                    <input type="time" name="time" value={formData.time} onChange={handleInputChange} required />
                  </div>

                  <div className="schedule-form-group">
                    <label>Venue *</label>
                    <input type="text" name="venue" placeholder="Enter venue" value={formData.venue} onChange={handleInputChange} required />
                  </div>

                  {/* Description */}
                  <div className="schedule-form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional details" rows="3" />
                  </div>

                  {/* Actions */}
                  <div className="schedule-form-actions">
                    <button type="submit" className="schedule-submit-btn">
                      Save Schedule
                    </button>
                    <button 
                      type="button" 
                      className="schedule-cancel-btn"
                      onClick={() => setFormData({
                        eventId: "",
                        bracketId: "",
                        round: "",
                        teamA: "",
                        teamB: "",
                        date: "",
                        time: "",
                        venue: "",
                        description: ""
                      })}
                    >
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Schedules */}
          {activeTab === "view" && (
            <div className="schedule-view-section">
              <h2>All Schedules</h2>
              {schedules.length === 0 ? (
                <div className="schedule-no-schedules">
                  <p>No schedules yet. Create one!</p>
                  <button className="schedule-create-first-btn" onClick={() => setActiveTab("create")}>
                    Create Schedule
                  </button>
                </div>
              ) : (
                <div className="schedule-grid">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="schedule-card">
                      <div className="schedule-card-header">
                        <h3>{schedule.teamA} vs {schedule.teamB}</h3>
                        <span>{schedule.round}</span>
                      </div>
                      <div className="schedule-card-info">
                        <div><strong>Event:</strong> {schedule.eventName}</div>
                        <div><strong>Bracket:</strong> {schedule.bracketName}</div>
                        <div><strong>Date:</strong> {schedule.date} {schedule.time}</div>
                        <div><strong>Venue:</strong> {schedule.venue}</div>
                        {schedule.description && <div>{schedule.description}</div>}
                      </div>
                      <div className="schedule-card-actions">
                        <button 
                          className="schedule-delete-btn"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SchedulesPage;
