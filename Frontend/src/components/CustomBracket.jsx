import React, { useEffect, useRef, useState } from 'react';
import "../style/CustomBrackets.css";

const CustomBracket = ({ matches }) => {
  const bracketRef = useRef(null);
  const [connectionPoints, setConnectionPoints] = useState([]);

  if (!matches || matches.length === 0) {
    return (
      <div className="no-matches">
        <div className="no-matches-content">
          <div className="no-matches-icon">🏆</div>
          <h3>No Tournament Created Yet</h3>
          <p>Generate matches by creating a bracket with teams to see the tournament structure.</p>
        </div>
      </div>
    );
  }

  // Group matches by round
  const rounds = {};
  matches.forEach(match => {
    if (!rounds[match.round_number]) {
      rounds[match.round_number] = [];
    }
    rounds[match.round_number].push(match);
  });

  const sortedRounds = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

  // Measure match positions
  useEffect(() => {
    if (!bracketRef.current) return;

    const matchEls = bracketRef.current.querySelectorAll(".match");
    const points = [];

    matchEls.forEach((matchEl) => {
      const roundIndex = parseInt(matchEl.closest(".round")?.dataset.round, 10);
      const matchIndex = parseInt(matchEl.dataset.match, 10);

      const rect = matchEl.getBoundingClientRect();
      const containerRect = bracketRef.current.getBoundingClientRect();

      // Right-center of current match
      const x = rect.right - containerRect.left;
      const y = rect.top - containerRect.top + rect.height / 2;

      // Left-center of current match (for connecting into)
      const xLeft = rect.left - containerRect.left;
      const yLeft = rect.top - containerRect.top + rect.height / 2;

      points.push({ roundIndex, matchIndex, x, y, xLeft, yLeft });
    });

    setConnectionPoints(points);
  }, [matches]);

  return (
    <div className="enhanced-bracket-wrapper">
      <div className="enhanced-bracket" ref={bracketRef}>
        {/* Connection Lines */}
        <svg className="connection-lines" xmlns="http://www.w3.org/2000/svg">
          {connectionPoints.map((fromPoint, i) => {
            const toPoint = connectionPoints.find(
              (p) =>
                p.roundIndex === fromPoint.roundIndex + 1 &&
                Math.floor(fromPoint.matchIndex / 2) === p.matchIndex
            );

            if (!toPoint) return null;

            // midpoint X (between child.right and parent.left)
            const midX = (fromPoint.x + toPoint.xLeft) / 2;

            return (
              <g key={i} className="bracket-connection">
                {/* child → halfway */}
                <line
                  x1={fromPoint.x}
                  y1={fromPoint.y}
                  x2={midX}
                  y2={fromPoint.y}
                  stroke="black"
                  strokeWidth="2"
                />
                {/* vertical line */}
                <line
                  x1={midX}
                  y1={fromPoint.y}
                  x2={midX}
                  y2={toPoint.yLeft}
                  stroke="black"
                  strokeWidth="2"
                />
                {/* into parent */}
                <line
                  x1={midX}
                  y1={toPoint.yLeft}
                  x2={toPoint.xLeft}
                  y2={toPoint.yLeft}
                  stroke="black"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Rounds */}
        <div className="bracket-container">
          {sortedRounds.map((roundNumber, roundIndex) => (
            <div key={roundNumber} className="round" data-round={roundIndex}>
              <div className="round-header">
                <div className="round-number">Round {roundNumber}</div>
                <div className="round-subtitle">
                  {roundNumber === '1' ? 'First Round' :
                   roundNumber === sortedRounds[sortedRounds.length - 1] ? 'Final' :
                   roundNumber === sortedRounds[sortedRounds.length - 2] ? 'Semi-Final' :
                   `Round ${roundNumber}`}
                </div>
              </div>
              <div className="matches">
                {rounds[roundNumber].map((match, matchIndex) => (
                  <div 
                    key={match.id} 
                    className={`match ${match.status}`}
                    data-match={matchIndex}
                  >
                    <div className="match-header">
                      <span className="match-id">Game #{match.id}</span>
                      <span className={`match-status ${match.status}`}>
                        {match.status === 'completed' ? '✓' : 
                         match.status === 'ongoing' ? '⏱️' : '📅'}
                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="teams-container">
                      <div className={`team team1 ${match.winner_id === match.team1_id ? 'winner' : ''}`}>
                        <div className="team-info">
                          <span className="team-name">
                            {match.team1_name || 'TBD'}
                          </span>
                          {match.winner_id === match.team1_id && (
                            <span className="winner-crown">👑</span>
                          )}
                        </div>
                        {match.score_team1 !== null && match.score_team1 !== undefined && (
                          <span className="score">{match.score_team1}</span>
                        )}
                      </div>

                      <div className="vs-divider">
                        {match.team2_id ? (
                          <span className="vs-text">VS</span>
                        ) : (
                          <span className="bye-text">BYE</span>
                        )}
                      </div>

                      <div className={`team team2 ${match.winner_id === match.team2_id ? 'winner' : ''}`}>
                        <div className="team-info">
                          <span className="team-name">
                            {match.team2_name || (match.team2_id ? 'TBD' : '')}
                          </span>
                          {match.winner_id === match.team2_id && (
                            <span className="winner-crown">👑</span>
                          )}
                        </div>
                        {match.score_team2 !== null && match.score_team2 !== undefined && (
                          <span className="score">{match.score_team2}</span>
                        )}
                      </div>
                    </div>

                    {match.status === 'completed' && match.winner_name && (
                      <div className="match-result">
                        <span className="trophy-icon">🏆</span>
                        <span className="winner-text">{match.winner_name} Wins!</span>
                      </div>
                    )}

                    {match.team2_id === null && (
                      <div className="bye-notice">
                        <span className="advance-icon">⚡</span>
                        {match.team1_name} advances automatically
                      </div>
                    )}

                    {match.status === 'ongoing' && (
                      <div className="live-indicator">
                        <span className="live-dot"></span>
                        LIVE MATCH
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {sortedRounds.length === 0 && (
          <div className="no-rounds">
            <div className="no-rounds-content">
              <div className="warning-icon">⚠️</div>
              <p>No tournament rounds found. Please check if matches were generated properly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomBracket;
