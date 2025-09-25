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

    const matchEls = bracketRef.current.querySelectorAll(".match");
    const points = [];

    matchEls.forEach((matchEl) => {
      const roundIndex = parseInt(matchEl.closest(".round")?.dataset.round, 10);
      const matchIndex = parseInt(matchEl.dataset.match, 10);
      const bracketType = matchEl.closest(".bracket-section")?.dataset.bracketType || 'winner';

      const rect = matchEl.getBoundingClientRect();
      const containerRect = bracketRef.current.getBoundingClientRect();

      const x = rect.right - containerRect.left;
      const y = rect.top - containerRect.top + rect.height / 2;
      const xLeft = rect.left - containerRect.left;
      const yLeft = rect.top - containerRect.top + rect.height / 2;

      points.push({ roundIndex, matchIndex, x, y, xLeft, yLeft, bracketType });
    });

    setConnectionPoints(points);
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

  // Function to render a single match component - USING SINGLE ELIMINATION CLASSES
  const renderMatch = (match, matchIndex, bracketType) => (
    <div 
      key={match.id} 
      className={`match ${match.status}`}
      data-match={matchIndex}
    >
      <div className="match-header">
        <span className="match-id">Game #{matchDisplayNumbers[match.id]}</span>
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
  );

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
          {connectionPoints.map((fromPoint, i) => {
            // Regular bracket connections within same bracket type
            const toPoint = connectionPoints.find(
              (p) =>
                p.bracketType === fromPoint.bracketType &&
                p.roundIndex === fromPoint.roundIndex + 1 &&
                Math.floor(fromPoint.matchIndex / 2) === p.matchIndex
            );

            // Set color based on bracket type
            let strokeColor = 'white'; // default
            if (fromPoint.bracketType === 'winner') {
              strokeColor = '#2196F3'; // blue
            } else if (fromPoint.bracketType === 'loser') {
              strokeColor = '#F44336'; // red
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
                </g>
              );
            }

            // Special connections to championship (YELLOW LINES)
            const championshipPoint = connectionPoints.find(p => p.bracketType === 'championship');
            if (championshipPoint) {
              // Connect last winner bracket match to championship
              if (fromPoint.bracketType === 'winner' && 
                  fromPoint.roundIndex === Math.max(...connectionPoints.filter(p => p.bracketType === 'winner').map(p => p.roundIndex))) {
                return (
                  <g key={`winner-to-championship-${i}`} className="double-bracket-connection">
                    <line
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={championshipPoint.xLeft - 20}
                      y2={fromPoint.y}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <line
                      x1={championshipPoint.xLeft - 20}
                      y1={fromPoint.y}
                      x2={championshipPoint.xLeft - 20}
                      y2={championshipPoint.yLeft - 30}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <line
                      x1={championshipPoint.xLeft - 20}
                      y1={championshipPoint.yLeft - 30}
                      x2={championshipPoint.xLeft}
                      y2={championshipPoint.yLeft - 30}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                  </g>
                );
              }

              // Connect last loser bracket match to championship
              if (fromPoint.bracketType === 'loser' && 
                  fromPoint.roundIndex === Math.max(...connectionPoints.filter(p => p.bracketType === 'loser').map(p => p.roundIndex))) {
                return (
                  <g key={`loser-to-championship-${i}`} className="double-bracket-connection">
                    <line
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={championshipPoint.xLeft - 20}
                      y2={fromPoint.y}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <line
                      x1={championshipPoint.xLeft - 20}
                      y1={fromPoint.y}
                      x2={championshipPoint.xLeft - 20}
                      y2={championshipPoint.yLeft + 30}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <line
                      x1={championshipPoint.xLeft - 20}
                      y1={championshipPoint.yLeft + 30}
                      x2={championshipPoint.xLeft}
                      y2={championshipPoint.yLeft + 30}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                  </g>
                );
              }
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
              <div className={`bracket-section championship-bracket-section`} data-bracket-type="championship">
                <h3 className="double-bracket-title">Championship</h3>
                <div className="double-rounds-container">
                  <div className="round" data-round={0}>
                    <div className="matches">
                      {championshipMatches.map((match, matchIndex) => renderMatch(match, matchIndex, 'championship'))}
                    </div>
                  </div>
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
      </div>
    </div>
  );
};

export default DoubleEliminationBracket;