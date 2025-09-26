import React, { useEffect, useRef, useState } from 'react';
import '../style/DoubleEliminationBracket.css';

const DoubleEliminationBracket = ({ matches, eliminationType = 'double' }) => {
  const bracketRef = useRef(null);
  const [connectionPoints, setConnectionPoints] = useState([]);
  const [matchDisplayNumbers, setMatchDisplayNumbers] = useState({});

  useEffect(() => {
    if (!matches || matches.length === 0) return;

    const sortedMatches = [...matches].sort((a, b) => {
      if (a.round_number !== b.round_number) {
        return a.round_number - b.round_number;
      }
      if (a.bracket_type !== b.bracket_type) {
        const typeOrder = { 'winner': 0, 'loser': 1, 'championship': 2 };
        return typeOrder[a.bracket_type] - typeOrder[b.bracket_type];
      }
      return a.id - b.id;
    });

    const displayNumbers = {};
    sortedMatches.forEach((match, index) => {
      displayNumbers[match.id] = index + 1;
    });

    setMatchDisplayNumbers(displayNumbers);
  }, [matches]);

  // Measure match positions for connection lines
  useEffect(() => {
    if (!bracketRef.current) return;

    const measurePositions = () => {
      const matchEls = bracketRef.current.querySelectorAll(".match");
      const points = [];

      matchEls.forEach((matchEl) => {
        const roundEl = matchEl.closest(".round");
        const bracketSectionEl = matchEl.closest(".bracket-section");
        
        if (!roundEl || !bracketSectionEl) return;

        const roundIndex = parseInt(roundEl.dataset.round, 10) || 0;
        const matchIndex = parseInt(matchEl.dataset.match, 10) || 0;
        const bracketType = bracketSectionEl.dataset.bracketType || 'winner';

        const rect = matchEl.getBoundingClientRect();
        const containerRect = bracketRef.current.getBoundingClientRect();

        const x = rect.right - containerRect.left;
        const y = rect.top - containerRect.top + rect.height / 2;
        const xLeft = rect.left - containerRect.left;
        const yLeft = rect.top - containerRect.top + rect.height / 2;

        points.push({ roundIndex, matchIndex, x, y, xLeft, yLeft, bracketType });
      });

      setConnectionPoints(points);
    };

    // Measure initially and after layout changes
    measurePositions();
    
    const resizeObserver = new ResizeObserver(measurePositions);
    resizeObserver.observe(bracketRef.current);
    
    return () => resizeObserver.disconnect();
  }, [matches]);

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

  // Separate matches by bracket type
  const winnerMatches = matches.filter(m => m.bracket_type === 'winner');
  const loserMatches = matches.filter(m => m.bracket_type === 'loser');
  const championshipMatches = matches.filter(m => m.bracket_type === 'championship');
  
  // Check if there's a reset final (round 201)
  const hasResetFinal = championshipMatches.some(m => m.round_number === 201);
  const grandFinalMatch = championshipMatches.find(m => m.round_number === 200);
  const resetFinalMatch = championshipMatches.find(m => m.round_number === 201);

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

  // Function to render a single match component with reset final support
  const renderMatch = (match, matchIndex, bracketType) => {
    const isResetFinal = match.round_number === 201;
    const isGrandFinal = match.round_number === 200 && match.bracket_type === 'championship';
    const matchClasses = `match ${match.status} ${isResetFinal ? 'reset-final' : ''} ${isGrandFinal ? 'grand-final' : ''}`;
    
    return (
      <div 
        key={match.id} 
        className={matchClasses}
        data-match={matchIndex}
      >
        <div className="match-header">
          <span className="match-id">
            Game #{matchDisplayNumbers[match.id]}
            {isResetFinal && <span className="reset-final-badge">RESET</span>}
            {isGrandFinal && <span className="grand-final-badge">GRAND FINAL</span>}
          </span>
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
              <span className="vs-text">{isResetFinal ? 'RESET' : 'VS'}</span>
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
            <span className="winner-text">
              {match.winner_name} Wins{isResetFinal ? ' the Tournament!' : '!'}
            </span>
          </div>
        )}

        {isResetFinal && match.status !== 'completed' && (
          <div className="reset-final-notice">
            <span className="reset-icon">🔄</span>
            Bracket Reset - Both teams start fresh!
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
    );
  };

  // Function to render rounds for a bracket type
  const renderBracketSection = (rounds, matches, bracketType, title) => (
    <div className={`bracket-section ${bracketType}-bracket-section`} data-bracket-type={bracketType}>
      {title && <h3 className="double-bracket-title">{title}</h3>}
      <div className="double-rounds-container">
        {rounds.map((roundNumber, roundIndex) => {
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
            <div key={roundNumber} className="round" data-round={displayRoundNumber || 0}>
              <div className="round-header">
                <div className="round-number">{roundTitle}</div>
                <div className="round-subtitle">
                  {bracketType === 'championship' ? 'Final Match' :
                   bracketType === 'loser' && displayRoundNumber === 1 ? 'First LB Round' :
                   bracketType === 'loser' ? `LB Round ${displayRoundNumber}` :
                   displayRoundNumber === 1 ? 'First Round' :
                   `Round ${displayRoundNumber}`}
                </div>
              </div>
              <div className="matches">
                {roundMatches.map((match, matchIndex) => renderMatch(match, matchIndex, bracketType))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="double-bracket-wrapper">
      <div className="double-bracket" ref={bracketRef}>
        
        {/* Connection Lines */}
        <svg className="double-connection-lines" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrowGold" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#FFD700" />
            </marker>
            <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#FF6B35" />
            </marker>
          </defs>
          
          {connectionPoints.map((fromPoint, i) => {
            // Regular bracket connections within same bracket type
            const toPoint = connectionPoints.find(
              (p) =>
                p.bracketType === fromPoint.bracketType &&
                p.roundIndex === fromPoint.roundIndex + 1 &&
                Math.floor(fromPoint.matchIndex / 2) === p.matchIndex
            );

            // Set color based on bracket type
            let strokeColor = '#6366f1'; // default indigo
            if (fromPoint.bracketType === 'winner') {
              strokeColor = '#2563eb'; // blue
            } else if (fromPoint.bracketType === 'loser') {
              strokeColor = '#dc2626'; // red
            }

            if (toPoint) {
              const midX = (fromPoint.x + toPoint.xLeft) / 2;

              return (
                <g key={i} className="double-bracket-connection">
                  <line
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={fromPoint.y}
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1={midX}
                    y1={fromPoint.y}
                    x2={midX}
                    y2={toPoint.yLeft}
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1={midX}
                    y1={toPoint.yLeft}
                    x2={toPoint.xLeft}
                    y2={toPoint.yLeft}
                    stroke={strokeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              );
            }

            // Special connections to championship
            const grandFinalPoint = connectionPoints.find(p => 
              p.bracketType === 'championship' && 
              connectionPoints.filter(cp => cp.bracketType === 'championship').indexOf(p) === 0
            );
            
            if (grandFinalPoint) {
              // Connect winner bracket final to grand final (top team slot)
              const maxWinnerRound = Math.max(...connectionPoints.filter(p => p.bracketType === 'winner').map(p => p.roundIndex));
              if (fromPoint.bracketType === 'winner' && fromPoint.roundIndex === maxWinnerRound) {
                return (
                  <g key={`winner-to-grand-${i}`} className="winner-to-championship-connection">
                    <line
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={grandFinalPoint.xLeft - 30}
                      y2={fromPoint.y}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={grandFinalPoint.xLeft - 30}
                      y1={fromPoint.y}
                      x2={grandFinalPoint.xLeft - 30}
                      y2={grandFinalPoint.yLeft - 25}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={grandFinalPoint.xLeft - 30}
                      y1={grandFinalPoint.yLeft - 25}
                      x2={grandFinalPoint.xLeft}
                      y2={grandFinalPoint.yLeft - 25}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                      markerEnd="url(#arrowGold)"
                    />
                  </g>
                );
              }

              // Connect loser bracket final to grand final (bottom team slot)  
              const maxLoserRound = Math.max(...connectionPoints.filter(p => p.bracketType === 'loser').map(p => p.roundIndex));
              if (fromPoint.bracketType === 'loser' && fromPoint.roundIndex === maxLoserRound) {
                return (
                  <g key={`loser-to-grand-${i}`} className="loser-to-championship-connection">
                    <line
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={grandFinalPoint.xLeft - 30}
                      y2={fromPoint.y}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={grandFinalPoint.xLeft - 30}
                      y1={fromPoint.y}
                      x2={grandFinalPoint.xLeft - 30}
                      y2={grandFinalPoint.yLeft + 25}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={grandFinalPoint.xLeft - 30}
                      y1={grandFinalPoint.yLeft + 25}
                      x2={grandFinalPoint.xLeft}
                      y2={grandFinalPoint.yLeft + 25}
                      stroke="#FFD700"
                      strokeWidth="4"
                      strokeLinecap="round"
                      markerEnd="url(#arrowGold)"
                    />
                  </g>
                );
              }
            }

            // Connection from Grand Final to Reset Final (if bracket reset)
            const resetFinalPoint = connectionPoints.find(p => 
              p.bracketType === 'championship' && 
              connectionPoints.filter(cp => cp.bracketType === 'championship').indexOf(p) === 1
            );
            
            if (resetFinalPoint && fromPoint.bracketType === 'championship' && 
                connectionPoints.filter(cp => cp.bracketType === 'championship').indexOf(fromPoint) === 0) {
              
              const centerX = fromPoint.x / 2 + fromPoint.xLeft / 2;
              const centerY = (fromPoint.y + resetFinalPoint.yLeft) / 2;
              
              return (
                <g key={`grand-to-reset-${i}`} className="grand-to-reset-connection">
                  <line
                    x1={centerX}
                    y1={fromPoint.y + 15}
                    x2={centerX}
                    y2={resetFinalPoint.yLeft - 15}
                    stroke="#FF6B35"
                    strokeWidth="4"
                    strokeDasharray="8,4"
                    strokeLinecap="round"
                    markerEnd="url(#arrowOrange)"
                  />
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r="8"
                    fill="#FF6B35"
                    className="reset-trigger-indicator"
                  />
                  <text
                    x={centerX + 15}
                    y={centerY + 5}
                    fill="#FF6B35"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    RESET
                  </text>
                </g>
              );
            }

            return null;
          })}
        </svg>

        {/* Main Bracket Layout */}
        <div className="double-main-bracket-container">
          {/* Left Side - Winner's and Loser's Brackets */}
          <div className="double-left-brackets">
            {/* Winner's Bracket */}
            {winnerMatches.length > 0 && renderBracketSection(winnerRounds, winnerMatches, 'winner', "Winner's Bracket")}
            
            {/* Loser's Bracket */}
            {loserMatches.length > 0 && renderBracketSection(loserRounds, loserMatches, 'loser', "Loser's Bracket")}
          </div>

          {/* Right Side - Championship */}
          {championshipMatches.length > 0 && (
            <div className="double-right-championship">
              <div className={`bracket-section championship-bracket-section ${hasResetFinal ? 'has-reset' : ''}`} data-bracket-type="championship">
                <h3 className={`double-bracket-title ${hasResetFinal ? 'has-reset' : ''}`}>
                  Championship
                  {hasResetFinal && (
                    <span className="reset-final-info">Reset Format</span>
                  )}
                </h3>
                
                <div className="double-rounds-container">
                  {/* Grand Final - Always first */}
                  {grandFinalMatch && (
                    <div className="round championship-round" data-round="0">
                      <div className="round-header">
                        <div className="round-number">
                          {hasResetFinal ? 'Grand Final' : 'Grand Final'}
                        </div>
                        <div className="round-subtitle">
                          {hasResetFinal ? 'First Championship Match' : 'Winner Takes All'}
                        </div>
                      </div>
                      <div className="matches">
                        {renderMatch(grandFinalMatch, 0, 'championship')}
                      </div>
                      
                      {/* Visual connector to reset final */}
                      {hasResetFinal && resetFinalMatch && resetFinalMatch.status !== 'hidden' && (
                        <div className="championship-connector">
                          <div className="connector-line"></div>
                          <div className="connector-label">Bracket Reset Triggered</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Reset Final - Only if active and not hidden */}
                  {resetFinalMatch && resetFinalMatch.status !== 'hidden' && (
                    <div className="round championship-round" data-round="1">
                      <div className="round-header">
                        <div className="round-number">Reset Final</div>
                        <div className="round-subtitle">
                          {resetFinalMatch.status === 'completed' ? 'Tournament Complete!' : 'Fresh Start - Winner Takes All'}
                        </div>
                      </div>
                      <div className="matches">
                        {renderMatch(resetFinalMatch, 0, 'championship')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {(winnerRounds.length === 0 && loserRounds.length === 0) && (
          <div className="no-rounds">
            <div className="no-rounds-content">
              <div className="warning-icon">⚠️</div>
              <p>No tournament rounds found. Please check if matches were generated properly.</p>
            </div>
          </div>
        )}
        
        {/* Bracket Reset Explanation (if reset final exists and is active) */}
        {hasResetFinal && resetFinalMatch && resetFinalMatch.status !== 'hidden' && (
          <div className="bracket-reset-explanation">
            <div className="reset-explanation-content">
              <h4>🔄 Bracket Reset Active</h4>
              <p>
                The Loser's Bracket winner defeated the Winner's Bracket winner in the Grand Final!
                Since the Winner's Bracket team had not lost before, a Reset Final is now required.
                Both teams start the Reset Final with a clean slate.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleEliminationBracket;