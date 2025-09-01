import React, { useEffect, useRef } from 'react';
import "../style/CustomBrackets.css";

const CustomBracket = ({ matches }) => {
  const bracketRef = useRef(null);

  console.log("CustomBracket received matches:", matches);

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

  // Calculate SVG connections
  const generateConnections = () => {
    const connections = [];
    
    for (let i = 0; i < sortedRounds.length - 1; i++) {
      const currentRound = sortedRounds[i];
      const nextRound = sortedRounds[i + 1];
      const currentMatches = rounds[currentRound];
      const nextMatches = rounds[nextRound];

      currentMatches.forEach((match, matchIndex) => {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        if (nextMatches[nextMatchIndex]) {
          connections.push({
            fromRound: i,
            fromMatch: matchIndex,
            toRound: i + 1,
            toMatch: nextMatchIndex
          });
        }
      });
    }

    return connections;
  };

  const connections = generateConnections();

  useEffect(() => {
    // Force re-render connections when component mounts
    const timer = setTimeout(() => {
      if (bracketRef.current) {
        bracketRef.current.style.opacity = '1';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [matches]);

  return (
    <div className="enhanced-bracket-wrapper">
      <div className="enhanced-bracket" ref={bracketRef}>
        <svg className="connection-lines" xmlns="http://www.w3.org/2000/svg">
          {connections.map((conn, index) => (
            <g key={index}>
              <defs>
                <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <path
                d={`M ${300 + conn.fromRound * 340} ${120 + conn.fromMatch * 200} 
                    Q ${300 + conn.fromRound * 340 + 170} ${120 + conn.fromMatch * 200} 
                    ${300 + conn.toRound * 340} ${120 + conn.toMatch * 200}`}
                stroke={`url(#gradient-${index})`}
                strokeWidth="3"
                fill="none"
                className="connection-path"
              />
              <circle
                cx={300 + conn.fromRound * 340}
                cy={120 + conn.fromMatch * 200}
                r="4"
                fill="#4f46e5"
                className="connection-dot"
              />
            </g>
          ))}
        </svg>

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