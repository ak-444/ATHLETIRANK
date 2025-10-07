import React, { useState, useEffect } from "react";
import { FaTrophy, FaMedal, FaStar, FaCrown, FaSearch } from "react-icons/fa";
import "../../style/User_Awards & Standing.css"

const UserAwardsStandings = () => {
  const [events, setEvents] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [standings, setStandings] = useState([]);
  const [mvpData, setMvpData] = useState(null);
  const [awards, setAwards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTab, setContentTab] = useState("standings");
  const [view, setView] = useState("events"); // events, brackets, results

  // Safe number formatter
  const safeNumber = (value, decimals = 1) => {
    const num = Number(value);
    return isNaN(num) ? 0 : Number(num.toFixed(decimals));
  };

  useEffect(() => {
    fetchCompletedEvents();
  }, []);

  const fetchCompletedEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/awards/events/completed");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = async (event) => {
    setSelectedEvent(event);
    setSelectedBracket(null);
    setStandings([]);
    setMvpData(null);
    setAwards(null);
    setView("brackets");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/awards/events/${event.id}/completed-brackets`);
      const data = await res.json();
      setBrackets(data);
    } catch (err) {
      console.error("Error loading brackets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBracketSelect = async (bracket) => {
    setSelectedBracket(bracket);
    setView("results");
    setContentTab("standings");
    setLoading(true);

    try {
      const standingsRes = await fetch(`http://localhost:5000/api/awards/brackets/${bracket.id}/standings`);
      const standingsData = await standingsRes.json();
      setStandings(standingsData.standings || []);

      const awardsRes = await fetch(`http://localhost:5000/api/awards/brackets/${bracket.id}/mvp-awards`);
      const awardsData = await awardsRes.json();
      
      setMvpData(awardsData.awards?.mvp || null);
      setAwards(awardsData.awards || null);
    } catch (err) {
      console.error("Error loading awards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    // Navigate to home - you can replace with your navigation method
    window.location.href = "/";
  };

  const handleBackToEvents = () => {
    setView("events");
    setSelectedEvent(null);
    setSelectedBracket(null);
  };

  const handleBackToBrackets = () => {
    setView("brackets");
    setSelectedBracket(null);
  };

  const filteredStandings = standings.filter(team =>
    team.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAwardsForDisplay = () => {
    if (!awards || !selectedBracket) return [];
    
    const awardsArray = [];
    
    if (selectedBracket.sport_type === "basketball") {
      if (awards.mvp) {
        awardsArray.push({
          category: "Most Valuable Player",
          winner: awards.mvp.player_name || 'Unknown',
          team: awards.mvp.team_name || 'Unknown',
          stat: `${safeNumber(awards.mvp.ppg)} PPG`
        });
      }
      if (awards.best_playmaker) {
        awardsArray.push({
          category: "Best Playmaker",
          winner: awards.best_playmaker.player_name || 'Unknown',
          team: awards.best_playmaker.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_playmaker.apg)} APG`
        });
      }
      if (awards.best_defender) {
        awardsArray.push({
          category: "Best Defender",
          winner: awards.best_defender.player_name || 'Unknown',
          team: awards.best_defender.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_defender.spg)} SPG`
        });
      }
      if (awards.best_rebounder) {
        awardsArray.push({
          category: "Best Rebounder",
          winner: awards.best_rebounder.player_name || 'Unknown',
          team: awards.best_rebounder.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_rebounder.rpg)} RPG`
        });
      }
      if (awards.best_blocker) {
        awardsArray.push({
          category: "Best Blocker",
          winner: awards.best_blocker.player_name || 'Unknown',
          team: awards.best_blocker.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_blocker.bpg)} BPG`
        });
      }
    } else {
      if (awards.mvp) {
        awardsArray.push({
          category: "Most Valuable Player",
          winner: awards.mvp.player_name || 'Unknown',
          team: awards.mvp.team_name || 'Unknown',
          stat: `${safeNumber(awards.mvp.kpg)} K/G`
        });
      }
      if (awards.best_blocker) {
        awardsArray.push({
          category: "Best Blocker",
          winner: awards.best_blocker.player_name || 'Unknown',
          team: awards.best_blocker.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_blocker.bpg)} BPG, ${safeNumber(awards.best_blocker.hitting_percentage)}% Hit`
        });
      }
      if (awards.best_setter) {
        awardsArray.push({
          category: "Best Setter",
          winner: awards.best_setter.player_name || 'Unknown',
          team: awards.best_setter.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_setter.apg)} A/G`
        });
      }
      if (awards.best_libero) {
        awardsArray.push({
          category: "Best Libero",
          winner: awards.best_libero.player_name || 'Unknown',
          team: awards.best_libero.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_libero.dpg)} D/G, ${safeNumber(awards.best_libero.reception_percentage)}% Rec`
        });
      }
      if (awards.best_server) {
        awardsArray.push({
          category: "Best Server",
          winner: awards.best_server.player_name || 'Unknown',
          team: awards.best_server.team_name || 'Unknown',
          stat: `${safeNumber(awards.best_server.acepg)} ACE/G, ${safeNumber(awards.best_server.service_percentage)}% Srv`
        });
      }
    }
    
    return awardsArray.filter(a => a.winner && a.winner !== 'Unknown');
  };

  return (
    <div className="user-awards-page">
      <div className="awards-header">
        <div className="header-content">
          <div className="header-top">
            <button className="back-btn" onClick={handleBackToHome}>
              <span className="back-arrow">←</span>
              Back to Home
            </button>
          </div>
          
          <div className="header-title">
            <h1><FaTrophy className="header-icon"/>Awards & Standings</h1>
            <p>View tournament results, MVP stats, and awards</p>
          </div>
        </div>
      </div>

      <div className="awards-container">
        {/* Breadcrumb Navigation */}
        {(view === "brackets" || view === "results") && (
          <div className="breadcrumb">
            <button onClick={handleBackToEvents} className="breadcrumb-link">
              Tournaments
            </button>
            {selectedEvent && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{selectedEvent.name}</span>
              </>
            )}
            {view === "results" && selectedBracket && (
              <>
                <span className="breadcrumb-separator">/</span>
                <button onClick={handleBackToBrackets} className="breadcrumb-link">
                  Brackets
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{selectedBracket.name}</span>
              </>
            )}
          </div>
        )}

        {/* Events View */}
        {view === "events" && (
          <div className="awards-content">
            <div className="section-header">
              <h2>Completed Tournaments</h2>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading tournaments...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No completed tournaments</h3>
                <p>Check back later for tournament results and awards</p>
              </div>
            ) : (
              <>
                <div className="stats-info">
                  <span>{events.length} completed tournament{events.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="events-grid">
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      className="event-card"
                      onClick={() => handleEventSelect(event)}
                    >
                      <div className="event-card-header">
                        <h3>{event.name}</h3>
                        <span className={`sport-badge sport-${event.sport?.toLowerCase() || 'multi'}`}>
                          {event.sport || 'Multi-Sport'}
                        </span>
                      </div>
                      <div className="event-card-body">
                        <div className="event-info">
                          <div className="info-row">
                            <span className="info-label">Start:</span>
                            <span className="info-value">
                              {new Date(event.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">End:</span>
                            <span className="info-value">
                              {new Date(event.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Status:</span>
                            <span className="status-completed">Completed</span>
                          </div>
                        </div>
                      </div>
                      <div className="event-card-footer">
                        <button className="view-btn">
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Brackets View */}
        {view === "brackets" && selectedEvent && (
          <div className="awards-content">
            <div className="section-header">
              <h2>{selectedEvent.name} - Brackets</h2>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading brackets...</p>
              </div>
            ) : brackets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏀</div>
                <h3>No completed brackets</h3>
                <p>This tournament doesn't have any completed brackets yet</p>
              </div>
            ) : (
              <>
                <div className="stats-info">
                  <span>{brackets.length} completed bracket{brackets.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="brackets-grid">
                  {brackets.map(bracket => (
                    <div 
                      key={bracket.id} 
                      className="bracket-card"
                      onClick={() => handleBracketSelect(bracket)}
                    >
                      <div className="bracket-card-header">
                        <h3>{bracket.name}</h3>
                        <span className={`sport-badge sport-${bracket.sport_type}`}>
                          {bracket.sport_type}
                        </span>
                      </div>
                      <div className="bracket-card-body">
                        <div className="champion-section">
                          <FaTrophy className="champion-icon" />
                          <div className="champion-info">
                            <span className="champion-label">Champion</span>
                            <span className="champion-name">{bracket.winner_team_name}</span>
                          </div>
                        </div>
                        <div className="bracket-info">
                          <span className="bracket-type">
                            {bracket.elimination_type === 'double' ? 'Double Elimination' : 'Single Elimination'}
                          </span>
                        </div>
                      </div>
                      <div className="bracket-card-footer">
                        <button className="view-btn">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Results View */}
        {view === "results" && selectedEvent && selectedBracket && (
          <div className="awards-content">
            <div className="results-header">
              <div className="results-title">
                <h2>{selectedBracket.name}</h2>
                <div className="results-meta">
                  <span className={`sport-badge sport-${selectedBracket.sport_type}`}>
                    {selectedBracket.sport_type}
                  </span>
                  <span className="champion-badge">
                    <FaTrophy /> Champion: {selectedBracket.winner_team_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="results-tabs">
              <button
                className={`tab-button ${contentTab === "standings" ? "tab-active" : ""}`}
                onClick={() => setContentTab("standings")}
              >
                <FaTrophy /> Standings
              </button>
              <button
                className={`tab-button ${contentTab === "mvp" ? "tab-active" : ""}`}
                onClick={() => setContentTab("mvp")}
              >
                <FaCrown /> MVP
              </button>
              <button
                className={`tab-button ${contentTab === "awards" ? "tab-active" : ""}`}
                onClick={() => setContentTab("awards")}
              >
                <FaMedal /> Awards
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading results...</p>
              </div>
            ) : (
              <>
                {contentTab === "standings" && (
                  <div className="tab-content">
                    <div className="standings-header">
                      <div className="search-section">
                        
                        <input
                          type="text"
                          placeholder="Search teams..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input"
                        />
                      </div>
                    </div>

                    <div className="standings-table-wrapper">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Team</th>
                            <th>W</th>
                            <th>L</th>
                            {selectedBracket.sport_type === "basketball" ? (
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
                            <tr key={index} className={team.position <= 3 ? `podium-${team.position}` : ""}>
                              <td className="rank-cell">
                                {team.position <= 3 && (
                                  <span className="medal-icon">
                                    {team.position === 1 ? "🥇" : team.position === 2 ? "🥈" : "🥉"}
                                  </span>
                                )}
                                {team.position}
                              </td>
                              <td className="team-cell">
                                <strong>{team.team}</strong>
                              </td>
                              <td>{team.wins}</td>
                              <td>{team.losses}</td>
                              {selectedBracket.sport_type === "basketball" ? (
                                <>
                                  <td>{team.points_for}</td>
                                  <td>{team.points_against}</td>
                                  <td className={String(team.point_diff).startsWith('+') ? 'positive' : String(team.point_diff).startsWith('-') ? 'negative' : ''}>
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

                {contentTab === "mvp" && (
                  <div className="tab-content">
                    {!mvpData ? (
                      <div className="empty-state">
                        <div className="empty-icon">👤</div>
                        <h3>No MVP data available</h3>
                        <p>Player statistics are not available for this bracket</p>
                      </div>
                    ) : (
                      <div className="mvp-section">
                        <div className="mvp-header">
                          <div className="mvp-crown">
                            <FaCrown />
                          </div>
                          <h2>Tournament Most Valuable Player</h2>
                        </div>
                        
                        <div className="mvp-card">
                          <div className="mvp-player-info">
                            <h3>{mvpData.player_name || 'Unknown Player'}</h3>
                            <span className="mvp-team">{mvpData.team_name || 'Unknown Team'}</span>
                            <span className="mvp-jersey">#{mvpData.jersey_number || 'N/A'}</span>
                          </div>
                          
                          <div className="mvp-stats-grid">
                            <div className="stat-card">
                              <div className="stat-value">{mvpData.games_played || 0}</div>
                              <div className="stat-label">Games</div>
                            </div>

                            {selectedBracket.sport_type === "basketball" ? (
                              <>
                                <div className="stat-card highlight">
                                  <div className="stat-value">{safeNumber(mvpData.ppg)}</div>
                                  <div className="stat-label">PPG</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.apg)}</div>
                                  <div className="stat-label">APG</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.rpg)}</div>
                                  <div className="stat-label">RPG</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.spg)}</div>
                                  <div className="stat-label">SPG</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.bpg)}</div>
                                  <div className="stat-label">BPG</div>
                                </div>
                                <div className="stat-card highlight">
                                  <div className="stat-value">{safeNumber(mvpData.mvp_score, 2)}</div>
                                  <div className="stat-label">MVP Score</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="stat-card highlight">
                                  <div className="stat-value">{safeNumber(mvpData.kpg)}</div>
                                  <div className="stat-label">K/G</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.apg)}</div>
                                  <div className="stat-label">A/G</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.dpg)}</div>
                                  <div className="stat-label">D/G</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.bpg)}</div>
                                  <div className="stat-label">B/G</div>
                                </div>
                                <div className="stat-card">
                                  <div className="stat-value">{safeNumber(mvpData.acepg)}</div>
                                  <div className="stat-label">Ace/G</div>
                                </div>
                                <div className="stat-card highlight">
                                  <div className="stat-value">{safeNumber(mvpData.mvp_score, 2)}</div>
                                  <div className="stat-label">MVP Score</div>
                                </div>
                              </>
                            )}
                          </div>

                          {selectedBracket.sport_type === "volleyball" && (
                            <div className="percentage-section">
                              <h4>Performance Percentages</h4>
                              <div className="percentage-grid">
                                <div className="percentage-item">
                                  <div className="percentage-bar">
                                    <div 
                                      className="percentage-fill"
                                      style={{ width: `${Math.min(Math.max(mvpData.hitting_percentage || 0, 0), 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="percentage-label">
                                    <span>Hitting %</span>
                                    <strong>{safeNumber(mvpData.hitting_percentage)}%</strong>
                                  </div>
                                </div>
                                <div className="percentage-item">
                                  <div className="percentage-bar">
                                    <div 
                                      className="percentage-fill"
                                      style={{ width: `${Math.min(Math.max(mvpData.service_percentage || 0, 0), 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="percentage-label">
                                    <span>Service %</span>
                                    <strong>{safeNumber(mvpData.service_percentage)}%</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {contentTab === "awards" && (
                  <div className="tab-content">
                    {!awards || getAwardsForDisplay().length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">🏅</div>
                        <h3>No awards available</h3>
                        <p>Award data is not available for this bracket</p>
                      </div>
                    ) : (
                      <div className="awards-section">
                        <h2>Mythical 5</h2>
                        <div className="awards-grid">
                          {getAwardsForDisplay().map((award, index) => (
                            <div key={index} className="award-card">
                              <div className="award-icon">
                                {index === 0 ? <FaCrown /> : <FaStar />}
                              </div>
                              <div className="award-content">
                                <h4>{award.category}</h4>
                                <div className="award-winner">
                                  <strong>{award.winner}</strong>
                                  <span>{award.team}</span>
                                </div>
                                <div className="award-stat">
                                  {award.stat}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAwardsStandings;