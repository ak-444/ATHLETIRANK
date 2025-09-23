import React, { useState, useEffect } from "react";
import { FaTrophy, FaMedal, FaStar, FaCrown, FaDownload, FaSearch } from "react-icons/fa";
import "../../style/Admin_Awards & Standing.css";

const AdminAwardsStandings = ({ sidebarOpen }) => {
  const [activeTab, setActiveTab] = useState("standings");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [standings, setStandings] = useState([]);
  const [mvpData, setMvpData] = useState(null);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Mock events data
    setEvents([
      { id: 1, name: "Inter-School Basketball Championship", sport: "basketball", status: "completed", start_date: "2023-10-01", end_date: "2023-10-15" },
      { id: 2, name: "Volleyball Tournament 2023", sport: "volleyball", status: "completed", start_date: "2023-11-01", end_date: "2023-11-10" },
      { id: 3, name: "Summer Sports Festival", sport: "basketball", status: "ongoing", start_date: "2023-12-01", end_date: "2023-12-20" }
    ]);
  }, []);

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setLoading(true);
    
    // Mock standings data
    setTimeout(() => {
      if (event.sport === "basketball") {
        setStandings([
          { 
            position: 1, 
            team: "Phoenix Warriors", 
            wins: 8, 
            losses: 1, 
            points_for: 720, 
            points_against: 650, 
            point_diff: "+70",
            win_percentage: "88.9%"
          },
          { 
            position: 2, 
            team: "Thunder Hawks", 
            wins: 7, 
            losses: 2, 
            points_for: 680, 
            points_against: 640, 
            point_diff: "+40",
            win_percentage: "77.8%"
          },
          { 
            position: 3, 
            team: "Storm Eagles", 
            wins: 6, 
            losses: 3, 
            points_for: 645, 
            points_against: 620, 
            point_diff: "+25",
            win_percentage: "66.7%"
          },
          { 
            position: 4, 
            team: "Fire Dragons", 
            wins: 5, 
            losses: 4, 
            points_for: 590, 
            points_against: 595, 
            point_diff: "-5",
            win_percentage: "55.6%"
          },
          { 
            position: 5, 
            team: "Ice Wolves", 
            wins: 3, 
            losses: 6, 
            points_for: 540, 
            points_against: 580, 
            point_diff: "-40",
            win_percentage: "33.3%"
          },
          { 
            position: 6, 
            team: "Lightning Bolts", 
            wins: 2, 
            losses: 7, 
            points_for: 510, 
            points_against: 630, 
            point_diff: "-120",
            win_percentage: "22.2%"
          }
        ]);

        // Mock MVP data
        setMvpData({
          player_name: "Marcus Johnson",
          team: "Phoenix Warriors",
          jersey_number: 23,
          games_played: 9,
          points_per_game: 28.5,
          assists_per_game: 8.2,
          rebounds_per_game: 12.1,
          steals_per_game: 2.8,
          blocks_per_game: 1.5,
          field_goal_percentage: 58.2,
          three_point_percentage: 42.1,
          free_throw_percentage: 87.5,
          total_points: 257,
          total_assists: 74,
          total_rebounds: 109
        });

        // Mock awards data
        setAwards([
          { category: "Most Valuable Player", winner: "Marcus Johnson", team: "Phoenix Warriors", stat: "28.5 PPG" },
          { category: "Best Shooter", winner: "Sarah Chen", team: "Thunder Hawks", stat: "47.3% 3PT" },
          { category: "Best Defender", winner: "Alex Rodriguez", team: "Storm Eagles", stat: "3.2 STL/G" },
          { category: "Best Rookie", winner: "Jordan Smith", team: "Fire Dragons", stat: "18.5 PPG" },
          { category: "Team Captain Award", winner: "Elena Vasquez", team: "Phoenix Warriors", stat: "Leadership" },
          { category: "Sportsmanship Award", winner: "David Kim", team: "Ice Wolves", stat: "Fair Play" }
        ]);
      } else {
        // Volleyball standings
        setStandings([
          { 
            position: 1, 
            team: "Spike Masters", 
            wins: 12, 
            losses: 2, 
            sets_for: 38, 
            sets_against: 15, 
            set_ratio: "2.53",
            win_percentage: "85.7%"
          },
          { 
            position: 2, 
            team: "Net Crushers", 
            wins: 10, 
            losses: 4, 
            sets_for: 35, 
            sets_against: 22, 
            set_ratio: "1.59",
            win_percentage: "71.4%"
          },
          { 
            position: 3, 
            team: "Block Busters", 
            wins: 8, 
            losses: 6, 
            sets_for: 32, 
            sets_against: 28, 
            set_ratio: "1.14",
            win_percentage: "57.1%"
          }
        ]);

        setMvpData({
          player_name: "Isabella Martinez",
          team: "Spike Masters",
          jersey_number: 7,
          games_played: 14,
          kills_per_game: 18.2,
          assists_per_game: 4.8,
          digs_per_game: 12.5,
          blocks_per_game: 2.1,
          aces_per_game: 3.2,
          hitting_percentage: 0.421,
          service_percentage: 92.8,
          total_kills: 255,
          total_assists: 67,
          total_digs: 175
        });

        setAwards([
          { category: "Most Valuable Player", winner: "Isabella Martinez", team: "Spike Masters", stat: "18.2 K/G" },
          { category: "Best Setter", winner: "Anna Thompson", team: "Net Crushers", stat: "12.8 AST/G" },
          { category: "Best Libero", winner: "Maria Santos", team: "Block Busters", stat: "15.5 DIG/G" },
          { category: "Best Server", winner: "Jessica Liu", team: "Spike Masters", stat: "4.2 ACE/G" },
          { category: "Best Rookie", winner: "Sophie Brown", team: "Net Crushers", stat: "12.1 K/G" }
        ]);
      }
      setLoading(false);
    }, 1000);
  };

  // Filter standings based on search
  const filteredStandings = standings.filter(team =>
    team.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export standings to CSV
  const exportStandings = () => {
    if (standings.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (selectedEvent?.sport === "basketball") {
      csvContent += "Position,Team,Wins,Losses,Points For,Points Against,Point Diff,Win%\n";
      standings.forEach(team => {
        csvContent += `${team.position},${team.team},${team.wins},${team.losses},${team.points_for},${team.points_against},${team.point_diff},${team.win_percentage}\n`;
      });
    } else {
      csvContent += "Position,Team,Wins,Losses,Sets For,Sets Against,Set Ratio,Win%\n";
      standings.forEach(team => {
        csvContent += `${team.position},${team.team},${team.wins},${team.losses},${team.sets_for},${team.sets_against},${team.set_ratio},${team.win_percentage}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedEvent?.name}_standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-dashboard">
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="dashboard-header">
          <h1>Awards & Standings</h1>
          <p>View tournament standings, MVP stats, and awards</p>
        </div>

        <div className="dashboard-main">
          <div className="awards_standings_content">
            {/* Event Selection */}
            {!selectedEvent && (
              <div className="awards_standings_event_selection">
                <h2>Select Tournament Event</h2>
                <div className="awards_standings_event_grid">
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      className="awards_standings_event_card"
                      onClick={() => handleEventSelect(event)}
                    >
                      <div className="awards_standings_event_header">
                        <h3>{event.name}</h3>
                        <span className={`awards_standings_sport_badge awards_standings_sport_${event.sport}`}>
                          {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                        </span>
                      </div>
                      <div className="awards_standings_event_info">
                        <div><strong>Start:</strong> {new Date(event.start_date).toLocaleDateString()}</div>
                        <div><strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}</div>
                        <div><strong>Status:</strong> 
                          <span className={`awards_standings_status ${event.status}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                      <div className="awards_standings_event_actions">
                        <button className="awards_standings_view_btn">
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            {selectedEvent && (
              <>
                {/* Event Header */}
                <div className="awards_standings_selected_event">
                  <div className="awards_standings_event_title">
                    <h2>{selectedEvent.name}</h2>
                    <button 
                      className="awards_standings_back_btn"
                      onClick={() => {setSelectedEvent(null); setStandings([]); setMvpData(null); setAwards([]);}}
                    >
                      ← Back to Events
                    </button>
                  </div>
                  <div className="awards_standings_event_details">
                    <span><strong>Sport:</strong> {selectedEvent.sport}</span>
                    <span><strong>Status:</strong> {selectedEvent.status}</span>
                    <span><strong>Duration:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()} - {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="awards_standings_tabs">
                  <button
                    className={`awards_standings_tab_button ${activeTab === "standings" ? "awards_standings_tab_active" : ""}`}
                    onClick={() => setActiveTab("standings")}
                  >
                    <FaTrophy /> Team Standings
                  </button>
                  <button
                    className={`awards_standings_tab_button ${activeTab === "mvp" ? "awards_standings_tab_active" : ""}`}
                    onClick={() => setActiveTab("mvp")}
                  >
                    <FaCrown /> Tournament MVP
                  </button>
                  <button
                    className={`awards_standings_tab_button ${activeTab === "awards" ? "awards_standings_tab_active" : ""}`}
                    onClick={() => setActiveTab("awards")}
                  >
                    <FaMedal /> Awards
                  </button>
                </div>

                {loading ? (
                  <div className="awards_standings_loading">
                    <div className="awards_standings_spinner"></div>
                    <p>Loading tournament data...</p>
                  </div>
                ) : (
                  <>
                    {/* Team Standings Tab */}
                    {activeTab === "standings" && (
                      <div className="awards_standings_tab_content">
                        <div className="awards_standings_toolbar">
                          <div className="awards_standings_search_container">
                            <FaSearch className="awards_standings_search_icon" />
                            <input
                              type="text"
                              className="awards_standings_search_input"
                              placeholder="Search teams..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <button className="awards_standings_export_btn" onClick={exportStandings}>
                            <FaDownload /> Export CSV
                          </button>
                        </div>

                        <div className="awards_standings_table_container">
                          <table className="awards_standings_table">
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>W</th>
                                <th>L</th>
                                {selectedEvent.sport === "basketball" ? (
                                  <>
                                    <th>PF</th>
                                    <th>PA</th>
                                    <th>Diff</th>
                                  </>
                                ) : (
                                  <>
                                    <th>SF</th>
                                    <th>SA</th>
                                    <th>Ratio</th>
                                  </>
                                )}
                                <th>Win%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStandings.map((team, index) => (
                                <tr key={index} className={team.position <= 3 ? `awards_standings_podium_${team.position}` : ""}>
                                  <td className="awards_standings_rank">
                                    {team.position <= 3 && (
                                      <span className={`awards_standings_medal awards_standings_medal_${team.position}`}>
                                        {team.position === 1 ? "🥇" : team.position === 2 ? "🥈" : "🥉"}
                                      </span>
                                    )}
                                    {team.position}
                                  </td>
                                  <td className="awards_standings_team_name">
                                    <strong>{team.team}</strong>
                                  </td>
                                  <td>{team.wins}</td>
                                  <td>{team.losses}</td>
                                  {selectedEvent.sport === "basketball" ? (
                                    <>
                                      <td>{team.points_for}</td>
                                      <td>{team.points_against}</td>
                                      <td className={team.point_diff.startsWith('+') ? 'awards_standings_positive' : 'awards_standings_negative'}>
                                        {team.point_diff}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td>{team.sets_for}</td>
                                      <td>{team.sets_against}</td>
                                      <td>{team.set_ratio}</td>
                                    </>
                                  )}
                                  <td>{team.win_percentage}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* MVP Tab */}
                    {activeTab === "mvp" && mvpData && (
                      <div className="awards_standings_tab_content">
                        <div className="awards_standings_mvp_section">
                          <div className="awards_standings_mvp_header">
                            <div className="awards_standings_mvp_crown">
                              <FaCrown />
                            </div>
                            <h2>Tournament Most Valuable Player</h2>
                          </div>
                          
                          <div className="awards_standings_mvp_card">
                            <div className="awards_standings_mvp_info">
                              <div className="awards_standings_mvp_name_section">
                                <h3>{mvpData.player_name}</h3>
                                <span className="awards_standings_mvp_team">{mvpData.team}</span>
                                <span className="awards_standings_mvp_jersey">#{mvpData.jersey_number}</span>
                              </div>
                              
                              <div className="awards_standings_mvp_stats_grid">
                                <div className="awards_standings_stat_card">
                                  <div className="awards_standings_stat_value">{mvpData.games_played}</div>
                                  <div className="awards_standings_stat_label">Games Played</div>
                                </div>

                                {selectedEvent.sport === "basketball" ? (
                                  <>
                                    <div className="awards_standings_stat_card awards_standings_highlight">
                                      <div className="awards_standings_stat_value">{mvpData.points_per_game}</div>
                                      <div className="awards_standings_stat_label">PPG</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.assists_per_game}</div>
                                      <div className="awards_standings_stat_label">APG</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.rebounds_per_game}</div>
                                      <div className="awards_standings_stat_label">RPG</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.steals_per_game}</div>
                                      <div className="awards_standings_stat_label">SPG</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.blocks_per_game}</div>
                                      <div className="awards_standings_stat_label">BPG</div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="awards_standings_stat_card awards_standings_highlight">
                                      <div className="awards_standings_stat_value">{mvpData.kills_per_game}</div>
                                      <div className="awards_standings_stat_label">K/G</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.assists_per_game}</div>
                                      <div className="awards_standings_stat_label">A/G</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.digs_per_game}</div>
                                      <div className="awards_standings_stat_label">D/G</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.blocks_per_game}</div>
                                      <div className="awards_standings_stat_label">B/G</div>
                                    </div>
                                    <div className="awards_standings_stat_card">
                                      <div className="awards_standings_stat_value">{mvpData.aces_per_game}</div>
                                      <div className="awards_standings_stat_label">Ace/G</div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Shooting/Hitting Percentages */}
                              <div className="awards_standings_percentage_section">
                                <h4>Performance Percentages</h4>
                                <div className="awards_standings_percentage_grid">
                                  {selectedEvent.sport === "basketball" ? (
                                    <>
                                      <div className="awards_standings_percentage_card">
                                        <div className="awards_standings_percentage_bar">
                                          <div 
                                            className="awards_standings_percentage_fill"
                                            style={{ width: `${mvpData.field_goal_percentage}%` }}
                                          ></div>
                                        </div>
                                        <div className="awards_standings_percentage_label">
                                          <span>Field Goal %</span>
                                          <strong>{mvpData.field_goal_percentage}%</strong>
                                        </div>
                                      </div>
                                      <div className="awards_standings_percentage_card">
                                        <div className="awards_standings_percentage_bar">
                                          <div 
                                            className="awards_standings_percentage_fill"
                                            style={{ width: `${mvpData.three_point_percentage}%` }}
                                          ></div>
                                        </div>
                                        <div className="awards_standings_percentage_label">
                                          <span>3-Point %</span>
                                          <strong>{mvpData.three_point_percentage}%</strong>
                                        </div>
                                      </div>
                                      <div className="awards_standings_percentage_card">
                                        <div className="awards_standings_percentage_bar">
                                          <div 
                                            className="awards_standings_percentage_fill"
                                            style={{ width: `${mvpData.free_throw_percentage}%` }}
                                          ></div>
                                        </div>
                                        <div className="awards_standings_percentage_label">
                                          <span>Free Throw %</span>
                                          <strong>{mvpData.free_throw_percentage}%</strong>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="awards_standings_percentage_card">
                                        <div className="awards_standings_percentage_bar">
                                          <div 
                                            className="awards_standings_percentage_fill"
                                            style={{ width: `${(mvpData.hitting_percentage * 100)}%` }}
                                          ></div>
                                        </div>
                                        <div className="awards_standings_percentage_label">
                                          <span>Hitting %</span>
                                          <strong>{(mvpData.hitting_percentage * 100).toFixed(1)}%</strong>
                                        </div>
                                      </div>
                                      <div className="awards_standings_percentage_card">
                                        <div className="awards_standings_percentage_bar">
                                          <div 
                                            className="awards_standings_percentage_fill"
                                            style={{ width: `${mvpData.service_percentage}%` }}
                                          ></div>
                                        </div>
                                        <div className="awards_standings_percentage_label">
                                          <span>Service %</span>
                                          <strong>{mvpData.service_percentage}%</strong>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Awards Tab */}
                    {activeTab === "awards" && (
                      <div className="awards_standings_tab_content">
                        <div className="awards_standings_awards_section">
                          <h2>Tournament Awards</h2>
                          <div className="awards_standings_awards_grid">
                            {awards.map((award, index) => (
                              <div key={index} className="awards_standings_award_card">
                                <div className="awards_standings_award_icon">
                                  {index === 0 ? <FaCrown /> : <FaStar />}
                                </div>
                                <div className="awards_standings_award_content">
                                  <h4>{award.category}</h4>
                                  <div className="awards_standings_award_winner">
                                    <strong>{award.winner}</strong>
                                    <span>{award.team}</span>
                                  </div>
                                  <div className="awards_standings_award_stat">
                                    {award.stat}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAwardsStandings;