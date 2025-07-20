import { useState } from "react";
import Sidebar from "../../components/sidebar"

import "../../style/Admin_SchedulePage.css"

const SchedulesPage = ({sidebarOpen}) => {


const [activeTab, setActiveTab] = useState("create");
const [schedules, setSchedules] = useState([]);
const [formData, setFormData] = useState({
  matchName: "",
  sport: "",
  bracketType: "",
  teamA: "",
  teamB: "",
  date: "",
  time: "",
  venue: "",
  round: "",
  description: ""
});

const mockTeams = {
  Basketball: ["Warriors", "Lakers", "Celtics", "Bulls", "Heat"],
  Volleyball: ["Spikes", "Aces", "Thunders", "Storms", "Flames"]
}

const rounds = {
  single: ["Quarterfinals", "Semifinals", "Finals"],
  double: ["Upper Bracket Round 1", "Upper Bracket Round 2", "Upper Bracket Semifinals", "Upper Bracket Finals", "Lower Bracket Round 1", "Lower Bracket Round 2", "Lower Bracket Semifinals", "Lower Bracket Finals", "Grand Finals"]
}

const handleInputChange =  (e) => {

  const {name, value} = e.target;
  setFormData(prev => ({
    ...prev, [name]: value
  }));

  if(name === "sport") {
  setFormData(prev => ({
    ...prev,
    teamA: "",
    teamB: "",
    round: ""
  }))

  if(name === "bracketType") {
    setFormData(prev => ({
      ...prev,
      round: ""
    }))
  }
}

}



const handleSubmit = (e) => {
  
}

const handleDeleteSchedule = (id) => {

}



  return (
    <div className="admin-schedule">
      
      
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>

      <div className="schedule-header">
        <h1>Schedule Management</h1>
        <p>Create and manage tournament schedules for Arellano Univesity Intramurals</p>
      </div>

      <div className="schedule-container">

        <div className="schedule-tabs">
          <button className={`schedule-tab-button ${activeTab === "create" ? "schedule-active" : ""}`}
                              onclick ={() => setActiveTab("create") }
                              >Create
          </button>
            
          <button className={`schedule-tab-button ${activeTab === "view" ? "schedule-active" : ""}`}
                              onclick ={() => setActiveTab("view") }
                              >View Schedules({schedules.length})
          </button>  
        </div>

        {activeTab === "create" && (
          <div className="schedule-create-section">
            <div className="schedule-form-container">

              <h2>Create New Match Schedule</h2>

              <form onSubmit={handleSubmit} className="schedule-form">

                <div className="schedule-form-row">

                  <div className="schedule-form-group">
                    <label htmlFor="matchName">Match Name:</label>

                    <input type="text" 
                           id="matchName"
                           name="matchName"
                           value={formData.matchName} 
                           onChange={handleInputChange}
                           placeholder="e.g., Quarterfinal Match 1" required /> 
                  </div>

                  <div className="schedule-form-group">
                    <label htmlFor="sport">Sport:</label>

                    <select id="sport" name="sport"
                            value={formData.sport} onChange={handleInputChange}
                            required>
                              <option value="">Select a sport</option>
                              <option value="Basketball">Basketball</option>
                              <option value="Volleyball">Volleyball</option>
                            </select>
                  </div>

                </div>

                <div className="schdule-form-row">

                  <div className="schedule-form-group">
                    <label htmlFor="bracketType">Tournament Type:</label>
                    <select id="bracketType" name="bracketType"
                            value={formData.bracketType} onChange={handleInputChange}
                            required>
                              <option value="">Select tournament type</option>
                              <option value="single">Single Elimination</option>
                              <option value="double">Double Elimination</option>
                            </select>
                  </div>

                  <div className="schedule-form-group">
                    <label htmlFor="round">Round:</label>

                    <select 
                    id="round"
                    name="round"
                    value={formData.round}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.bracketType}
                    >
                      <option value="">Select round</option>
                      {formData.bracketType && rounds[formData.bracketType]?.map(round =>(
                        <option key={round} value={round}>{round}</option>
                      )) }
                    </select>
                    
                  </div>

                </div>


                <div className="schedule-form-row">

                  <div className="schedule-form-group">
                    <label htmlFor="teamA">Team A:</label>
                      <select
                      id="teamA"
                      name="teamA"
                      value={formData.teamA}
                      onChange={handleInputChange}
                      required
                      disabled ={!formData.sport}
                      >
                        <option value="">Select Team A</option>
                     </select>
                  </div>

                </div>

                

              </form>

            </div>
          </div>
        )}

      </div>

        
      </div>
    </div>
  );
};

export default SchedulesPage;
