import React, { useEffect, useRef, useState } from 'react';

const CustomBracket = ({ matches, eliminationType = 'single' }) => {
  const bracketRef = useRef(null);
  const [connectionPoints, setConnectionPoints] = useState([]);
  const [matchDisplayNumbers, setMatchDisplayNumbers] = useState({});

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    // Sort matches by round and then by id to get the correct order
    const sortedMatches = [...matches].sort((a, b) => {
      if (a.round_number !== b.round_number) {
        return a.round_number - b.round_number;
      }
      if (a.bracket_type !== b.bracket_type) {
        // Order: winner, loser, championship
        const typeOrder = { 'winner': 0, 'loser': 1, 'championship': 2 };
        return typeOrder[a.bracket_type] - typeOrder[b.bracket_type];
      }
      return a.id - b.id;
    });

    // Create a mapping of match ID to display number
    const displayNumbers = {};
    sortedMatches.forEach((match, index) => {
      displayNumbers[match.id] = index + 1;
    });

    setMatchDisplayNumbers(displayNumbers);
  }, [matches]);

  // Measure match positions for connection lines
  useEffect(() => {
    if (!bracketRef.current) return;

    const matchEls = bracketRef.current.querySelectorAll(".match");
    const points = [];

    matchEls.forEach((matchEl) => {
      const roundIndex = parseInt(matchEl.closest(".round")?.dataset.round, 10);
      const matchIndex = parseInt(matchEl.dataset.match, 10);
      const bracketType = matchEl.closest(".bracket-section")?.dataset.bracketType || 'winner';

      const rect = matchEl.getBoundingClientRect();
      const containerRect = bracketRef.current.getBoundingClientRect();

      // Right-center of current match
      const x = rect.right - containerRect.left;
      const y = rect.top - containerRect.top + rect.height / 2;

      // Left-center of current match (for connecting into)
      const xLeft = rect.left - containerRect.left;
      const yLeft = rect.top - containerRect.top + rect.height / 2;

      points.push({ roundIndex, matchIndex, x, y, xLeft, yLeft, bracketType });
    });

    setConnectionPoints(points);
  }, [matches, eliminationType]);

  if (!matches || matches.length === 0) {
    return (
      <div className="no-matches" style={styles.noMatches}>
        <div className="no-matches-content" style={styles.noMatchesContent}>
          <div className="no-matches-icon" style={styles.noMatchesIcon}>🏆</div>
          <h3>No Tournament Created Yet</h3>
          <p>Generate matches by creating a bracket with teams to see the tournament structure.</p>
        </div>
      </div>
    );
  }

  // Separate matches by bracket type for double elimination
  const winnerMatches = matches.filter(m => m.bracket_type === 'winner');
  const loserMatches = matches.filter(m => m.bracket_type === 'loser');
  const championshipMatches = matches.filter(m => m.bracket_type === 'championship');

  // Group matches by round for each bracket type
  const groupMatchesByRound = (matches) => {
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });
    
    return Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
  };

  const winnerRounds = groupMatchesByRound(winnerMatches);
  const loserRounds = groupMatchesByRound(loserMatches);

  // Function to render a single match component (with consistent styling)
  const renderMatch = (match, matchIndex) => (
    <div 
      key={match.id} 
      className={`match ${match.status}`}
      data-match={matchIndex}
      style={styles.match}
    >
      <div className="match-header" style={styles.matchHeader}>
        <span className="match-id" style={styles.matchId}>Game #{matchDisplayNumbers[match.id]}</span>
        <span className={`match-status ${match.status}`} style={{
          ...styles.matchStatus,
          ...(match.status === 'scheduled' ? styles.scheduledStatus : {}),
          ...(match.status === 'ongoing' ? styles.ongoingStatus : {}),
          ...(match.status === 'completed' ? styles.completedStatus : {})
        }}>
          {match.status === 'completed' ? '✓' : 
            match.status === 'ongoing' ? '⏱️' : '📅'}
          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </span>
      </div>
      
      <div className="teams-container" style={styles.teamsContainer}>
        <div className={`team team1 ${match.winner_id === match.team1_id ? 'winner' : ''}`} style={{
          ...styles.team,
          ...(match.winner_id === match.team1_id ? styles.winner : {})
        }}>
          <div className="team-info" style={styles.teamInfo}>
            <span className="team-name" style={styles.teamName}>
              {match.team1_name || 'TBD'}
            </span>
            {match.winner_id === match.team1_id && (
              <span className="winner-crown" style={styles.winnerCrown}>👑</span>
            )}
          </div>
          {match.score_team1 !== null && match.score_team1 !== undefined && (
            <span className="score" style={styles.score}>{match.score_team1}</span>
          )}
        </div>

        <div className="vs-divider" style={styles.vsDivider}>
          {match.team2_id ? (
            <span className="vs-text" style={styles.vsText}>VS</span>
          ) : (
            <span className="bye-text" style={styles.vsText}>BYE</span>
          )}
        </div>

        <div className={`team team2 ${match.winner_id === match.team2_id ? 'winner' : ''}`} style={{
          ...styles.team,
          ...(match.winner_id === match.team2_id ? styles.winner : {})
        }}>
          <div className="team-info" style={styles.teamInfo}>
            <span className="team-name" style={styles.teamName}>
              {match.team2_name || (match.team2_id ? 'TBD' : '')}
            </span>
            {match.winner_id === match.team2_id && (
              <span className="winner-crown" style={styles.winnerCrown}>👑</span>
            )}
          </div>
          {match.score_team2 !== null && match.score_team2 !== undefined && (
            <span className="score" style={styles.score}>{match.score_team2}</span>
          )}
        </div>
      </div>

      {match.status === 'completed' && match.winner_name && (
        <div className="match-result" style={styles.matchResult}>
          <span className="trophy-icon" style={styles.trophyIcon}>🏆</span>
          <span className="winner-text">{match.winner_name} Wins!</span>
        </div>
      )}

      {match.team2_id === null && (
        <div className="bye-notice" style={styles.byeNotice}>
          <span className="advance-icon">⚡</span>
          {match.team1_name} advances automatically
        </div>
      )}

      {match.status === 'ongoing' && (
        <div className="live-indicator" style={styles.liveIndicator}>
          <span className="live-dot" style={styles.liveDot}></span>
          LIVE MATCH
        </div>
      )}
    </div>
  );

  // Function to render a round section (with consistent styling)
  const renderRoundSection = (roundNumber, matches, bracketType) => {
    let displayRoundNumber, roundTitle;
    
    if (bracketType === 'loser') {
      displayRoundNumber = roundNumber - 100;
      roundTitle = `LB Round ${displayRoundNumber}`;
    } else if (bracketType === 'championship') {
      roundTitle = "Championship";
    } else {
      displayRoundNumber = roundNumber;
      roundTitle = `Round ${displayRoundNumber}`;
    }

    const roundMatches = matches.filter(m => m.round_number == roundNumber);

    return (
      <div key={roundNumber} className="round" data-round={displayRoundNumber || 0} style={styles.round}>
        <div className="round-header" style={{
          ...styles.roundHeader,
          ...(bracketType === 'loser' ? styles.loserRoundHeader : {}),
          ...(bracketType === 'championship' ? styles.championshipRoundHeader : {})
        }}>
          <div className="round-number" style={styles.roundNumber}>{roundTitle}</div>
          <div className="round-subtitle" style={styles.roundSubtitle}>
            {bracketType === 'championship' ? 'Final Match' :
             bracketType === 'loser' && displayRoundNumber === 1 ? 'First LB Round' :
             bracketType === 'loser' ? `LB Round ${displayRoundNumber}` :
             displayRoundNumber === 1 ? 'First Round' :
             `Round ${displayRoundNumber}`}
          </div>
        </div>
        <div className="matches" style={styles.matches}>
          {roundMatches.map((match, matchIndex) => renderMatch(match, matchIndex))}
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-bracket-wrapper" style={styles.wrapper}>
      <div className="enhanced-bracket" ref={bracketRef} style={styles.bracket}>
        
        {/* Tournament Title */}
        <div style={styles.tournamentTitle}>
          {eliminationType === 'double' ? 'Double Elimination Tournament' : 'Single Elimination Tournament'}
        </div>

        {/* Connection Lines */}
        <svg className="connection-lines" xmlns="http://www.w3.org/2000/svg" style={styles.connectionLines}>
          {connectionPoints.map((fromPoint, i) => {
            // For double elimination, we need different connection logic
            if (eliminationType === 'double') {
              // Connect within the same bracket type
              const toPoint = connectionPoints.find(
                (p) =>
                  p.bracketType === fromPoint.bracketType &&
                  p.roundIndex === fromPoint.roundIndex + 1 &&
                  Math.floor(fromPoint.matchIndex / 2) === p.matchIndex
              );

              if (!toPoint) return null;

              const midX = (fromPoint.x + toPoint.xLeft) / 2;
              const strokeColor = fromPoint.bracketType === 'loser' ? '#ff6b6b' : 
                                 fromPoint.bracketType === 'championship' ? '#ffd700' : '#4dabf7';

              return (
                <g key={i} className="bracket-connection">
                  <line
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={fromPoint.y}
                    stroke={strokeColor}
                    strokeWidth="3"
                  />
                  <line
                    x1={midX}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={toPoint.yLeft}
                    stroke={strokeColor}
                    strokeWidth="3"
                  />
                  <line
                    x1={midX}
                    y1={toPoint.yLeft}
                    x2={toPoint.xLeft}
                    y2={toPoint.yLeft}
                    stroke={strokeColor}
                    strokeWidth="3"
                  />
                  <circle cx={fromPoint.x} cy={fromPoint.y} r="4" fill={strokeColor} />
                  <circle cx={toPoint.xLeft} cy={toPoint.yLeft} r="4" fill={strokeColor} />
                </g>
              );
            } else {
              // Single elimination connection logic
              const toPoint = connectionPoints.find(
                (p) =>
                  p.roundIndex === fromPoint.roundIndex + 1 &&
                  Math.floor(fromPoint.matchIndex / 2) === p.matchIndex
              );

              if (!toPoint) return null;

              const midX = (fromPoint.x + toPoint.xLeft) / 2;

              return (
                <g key={i} className="bracket-connection">
                  <line
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={fromPoint.y}
                    stroke="#4dabf7"
                    strokeWidth="3"
                  />
                  <line
                    x1={midX}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={toPoint.yLeft}
                    stroke="#4dabf7"
                    strokeWidth="3"
                  />
                  <line
                    x1={midX}
                    y1={toPoint.yLeft}
                    x2={toPoint.xLeft}
                    y2={toPoint.yLeft}
                    stroke="#4dabf7"
                    strokeWidth="3"
                  />
                  <circle cx={fromPoint.x} cy={fromPoint.y} r="4" fill="#4dabf7" />
                  <circle cx={toPoint.xLeft} cy={toPoint.yLeft} r="4" fill="#4dabf7" />
                </g>
              );
            }
          })}
        </svg>

        {/* Bracket Container */}
        <div className="bracket-container" style={styles.bracketContainer}>
          {(eliminationType === 'double' || loserMatches.length > 0 || championshipMatches.length > 0) ? (
            <div className="double-elimination-bracket" style={styles.doubleEliminationBracket}>
              {/* Winner's Bracket */}
              <div className="bracket-section winner-bracket" data-bracket-type="winner" style={styles.bracketSection}>
                <h3 className="bracket-title" style={{
                  ...styles.bracketTitle,
                  ...styles.winnerBracketTitle
                }}>Winner's Bracket</h3>
                <div className="rounds-container" style={styles.roundsContainer}>
                  {winnerRounds.map(roundNumber => 
                    renderRoundSection(roundNumber, winnerMatches, 'winner')
                  )}
                </div>
              </div>

              {/* Loser's Bracket */}
              {loserMatches.length > 0 && (
                <div className="bracket-section loser-bracket" data-bracket-type="loser" style={styles.bracketSection}>
                  <h3 className="bracket-title" style={{
                    ...styles.bracketTitle,
                    ...styles.loserBracketTitle
                  }}>Loser's Bracket</h3>
                  <div className="rounds-container" style={styles.roundsContainer}>
                    {loserRounds.map(roundNumber => 
                      renderRoundSection(roundNumber, loserMatches, 'loser')
                    )}
                  </div>
                </div>
              )}

              {/* Championship Match */}
              {championshipMatches.length > 0 && (
                <div className="bracket-section championship-bracket" data-bracket-type="championship" style={styles.bracketSection}>
                  <h3 className="bracket-title" style={{
                    ...styles.bracketTitle,
                    ...styles.championshipBracketTitle
                  }}>Championship</h3>
                  <div className="rounds-container" style={styles.roundsContainer}>
                    {renderRoundSection(200, championshipMatches, 'championship')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Single Elimination Bracket (original layout)
            winnerRounds.map((roundNumber, roundIndex) => (
              <div key={roundNumber} className="round" data-round={roundIndex} style={styles.round}>
                <div className="round-header" style={styles.roundHeader}>
                  <div className="round-number" style={styles.roundNumber}>Round {roundNumber}</div>
                  <div className="round-subtitle" style={styles.roundSubtitle}>
                    {roundNumber === '1' ? 'First Round' :
                     roundNumber === winnerRounds[winnerRounds.length - 1] ? 'Final' :
                     roundNumber === winnerRounds[winnerRounds.length - 2] ? 'Semi-Final' :
                     `Round ${roundNumber}`}
                  </div>
                </div>
                <div className="matches" style={styles.matches}>
                  {winnerMatches
                    .filter(m => m.round_number == roundNumber)
                    .map((match, matchIndex) => renderMatch(match, matchIndex))
                  }
                </div>
              </div>
            ))
          )}
        </div>

        {winnerRounds.length === 0 && (
          <div className="no-rounds" style={styles.noMatches}>
            <div className="no-rounds-content" style={styles.noMatchesContent}>
              <div className="warning-icon" style={styles.noMatchesIcon}>⚠️</div>
              <p>No tournament rounds found. Please check if matches were generated properly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: '32px',
    background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
    borderRadius: '16px',
    minHeight: '500px',
    position: 'relative',
    overflow: 'visible'
  },

  bracket: {
    position: 'relative',
    zIndex: 1,
    opacity: 0.95,
    transition: 'opacity 0.3s ease'
  },

  tournamentTitle: {
    textAlign: 'center',
    marginBottom: '30px',
    color: 'white',
    fontSize: '2em',
    fontWeight: '700',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },

  doubleEliminationBracket: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '40px',
    justifyContent: 'center'
  },

  bracketSection: {
    flex: 1,
    minWidth: '300px',
    marginBottom: '30px'
  },

  bracketTitle: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '20px',
    padding: '12px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    margin: 0,
    fontSize: '1.2em',
    fontWeight: '600'
  },

  winnerBracketTitle: {
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
  },

  loserBracketTitle: {
    background: 'linear-gradient(135deg, #7e1a1a 0%, #933928 100%)'
  },

  championshipBracketTitle: {
    background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
    flexBasis: '100%',
    maxWidth: '400px',
    margin: '20px auto'
  },

  roundsContainer: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center'
  },

  connectionLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0
  },

  bracketContainer: {
    display: 'flex',
    gap: '80px',
    overflowX: 'auto',
    padding: '24px 0',
    position: 'relative',
    zIndex: 1
  },

  round: {
    minWidth: '320px',
    width: '320px', // Fixed width
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around'
  },

  roundHeader: {
    textAlign: 'center',
    marginBottom: '24px',
    padding: '16px',
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
    color: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(26, 35, 126, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },

  loserRoundHeader: {
    background: 'linear-gradient(135deg, #7e1a1a 0%, #933928 100%)'
  },

  championshipRoundHeader: {
    background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)'
  },

  roundNumber: {
    margin: 0,
    fontSize: '1.4em',
    fontWeight: '700',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },

  roundSubtitle: {
    fontSize: '0.9em',
    opacity: 0.9,
    marginTop: '4px'
  },

  matches: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    flexGrow: 1,
    gap: '20px' // Consistent spacing between matches
  },

  match: {
    background: 'rgba(15, 23, 42, 0.85)',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    padding: '20px',
    width: '280px', // Fixed width for all matches
    minWidth: '280px',
    maxWidth: '280px',
    boxSizing: 'border-box',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
    position: 'relative'
  },

  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },

  matchId: {
    fontWeight: '600',
    color: '#e0e0e0',
    fontSize: '0.9em'
  },

  matchStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8em',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  scheduledStatus: {
    background: 'linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%)',
    color: 'white'
  },

  ongoingStatus: {
    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
    color: 'white'
  },

  completedStatus: {
    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
    color: 'white'
  },

  teamsContainer: {
    marginBottom: '16px'
  },

  team: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    margin: '6px 0',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.08)',
    fontWeight: '500',
    color: '#e0e0e0',
    transition: 'all 0.3s ease'
  },

  winner: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    color: '#a7f3d0',
    fontWeight: '600',
    transform: 'scale(1.02)'
  },

  teamInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
  },

  teamName: {
    fontSize: '1.05em',
    color: '#ffffff',
    fontWeight: '600',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
  },

  winnerCrown: {
    animation: 'bounce 1s infinite'
  },

  score: {
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: '700',
    minWidth: '40px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(26, 35, 126, 0.3)'
  },

  vsDivider: {
    textAlign: 'center',
    padding: '12px',
    position: 'relative'
  },

  vsText: {
    background: 'linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '0.8em',
    display: 'inline-block',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  },

  matchResult: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
    padding: '12px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '10px',
    fontWeight: '600',
    color: '#a7f3d0'
  },

  trophyIcon: {
    fontSize: '1.2em',
    animation: 'rotate 2s linear infinite'
  },

  byeNotice: {
    marginTop: '12px',
    padding: '10px 12px',
    background: 'linear-gradient(135deg, rgba(92, 107, 192, 0.1) 0%, rgba(92, 107, 192, 0.05) 100%)',
    border: '1px solid rgba(92, 107, 192, 0.2)',
    borderRadius: '8px',
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#c5cae9',
    fontSize: '0.9em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },

  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '12px',
    padding: '8px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    fontWeight: '600',
    fontSize: '0.85em'
  },

  liveDot: {
    width: '8px',
    height: '8px',
    background: '#ef4444',
    borderRadius: '50%',
    animation: 'livePulse 1.5s infinite ease-in-out'
  },

  noMatches: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)'
  },

  noMatchesContent: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '40px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  noMatchesIcon: {
    fontSize: '4em',
    marginBottom: '16px',
    opacity: 0.8
  }
};

// Add keyframe animations
const addKeyframeAnimations = () => {
  if (typeof document !== 'undefined' && !document.getElementById('bracket-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'bracket-animations';
    styleSheet.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-4px); }
        60% { transform: translateY(-2px); }
      }
      
      @keyframes rotate {
        0% { transform: rotate(0deg); }
        10% { transform: rotate(-10deg); }
        20% { transform: rotate(10deg); }
        30% { transform: rotate(-10deg); }
        40% { transform: rotate(10deg); }
        50% { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes livePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
      
      @keyframes pulseMatch {
        0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 0 0 rgba(245, 158, 11, 0.4); }
        50% { box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 0 20px rgba(245, 158, 11, 0.3); }
      }
      
      .match:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.35), 0 5px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        z-index: 10;
      }
      
      .match.completed {
        border-color: rgba(34, 197, 94, 0.4);
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
      }
      
      .match.ongoing {
        border-color: rgba(245, 158, 11, 0.5);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%);
        animation: pulseMatch 2s infinite ease-in-out;
      }
      
      .loser-bracket .match {
        border-color: rgba(255, 107, 107, 0.4);
      }
      
      .loser-bracket .match::before {
        background: linear-gradient(135deg, transparent 0%, rgba(255, 41, 41, 0.15) 50%, transparent 100%);
      }
      
      .loser-bracket .score {
        background: linear-gradient(135deg, #7e1a1a 0%, #933928 100%);
      }
      
      .loser-bracket .vs-text,
      .loser-bracket .bye-text {
        background: linear-gradient(135deg, #c05c5c 0%, #ab3939 100%);
      }
      
      .championship-bracket .match {
        border-color: rgba(255, 215, 0, 0.6);
        box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 0 25px rgba(255, 215, 0, 0.4);
      }
      
      .championship-bracket .score {
        background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
      }
      
      .championship-bracket .vs-text,
      .championship-bracket .bye-text {
        background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
      }
      
      @media (max-width: 768px) {
        .enhanced-bracket-wrapper {
          padding: 20px;
        }
        
        .double-elimination-bracket {
          flex-direction: column;
        }
        
        .bracket-section {
          min-width: 100%;
        }
        
        .bracket-container {
          flex-direction: column;
          gap: 30px;
        }
        
        .round {
          min-width: 100%;
        }
        
        .match {
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .connection-lines {
          display: none;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
};

// Initialize animations when component mounts
if (typeof window !== 'undefined') {
  addKeyframeAnimations();
}

export default CustomBracket;