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

    const matchEls = bracketRef.current.querySelectorAll(".double-match");
    const points = [];

    matchEls.forEach((matchEl) => {
      const roundIndex = parseInt(matchEl.closest(".double-round")?.dataset.round, 10);
      const matchIndex = parseInt(matchEl.dataset.match, 10);
      const bracketType = matchEl.closest(".double-bracket-section")?.dataset.bracketType || 'winner';

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
      <div className="double-no-matches">
        <div className="double-no-matches-content">
          <div className="double-no-matches-icon">🏆</div>
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

  // Function to render a single match component
  const renderMatch = (match, matchIndex, bracketType) => (
    <div 
      key={match.id} 
      className={`double-match ${match.status} ${bracketType}-match`}
      data-match={matchIndex}
    >
      <div className="double-match-header">
        <span className="double-match-id">Game #{matchDisplayNumbers[match.id]}</span>
        <span className={`double-match-status ${match.status}`}>
          {match.status === 'completed' ? '✓' : 
            match.status === 'ongoing' ? '⏱️' : '📅'}
          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </span>
      </div>
      
      <div className="double-teams-container">
        <div className={`double-team double-team1 ${match.winner_id === match.team1_id ? 'winner' : ''}`}>
          <div className="double-team-info">
            <span className="double-team-name">
              {match.team1_name || 'TBD'}
            </span>
            {match.winner_id === match.team1_id && (
              <span className="double-winner-crown">👑</span>
            )}
          </div>
          {match.score_team1 !== null && match.score_team1 !== undefined && (
            <span className="double-score">{match.score_team1}</span>
          )}
        </div>

        <div className="double-vs-divider">
          {match.team2_id ? (
            <span className="double-vs-text">VS</span>
          ) : (
            <span className="double-bye-text">BYE</span>
          )}
        </div>

        <div className={`double-team double-team2 ${match.winner_id === match.team2_id ? 'winner' : ''}`}>
          <div className="double-team-info">
            <span className="double-team-name">
              {match.team2_name || (match.team2_id ? 'TBD' : '')}
            </span>
            {match.winner_id === match.team2_id && (
              <span className="double-winner-crown">👑</span>
            )}
          </div>
          {match.score_team2 !== null && match.score_team2 !== undefined && (
            <span className="double-score">{match.score_team2}</span>
          )}
        </div>
      </div>

      {match.status === 'completed' && match.winner_name && (
        <div className="double-match-result">
          <span className="double-trophy-icon">🏆</span>
          <span className="double-winner-text">{match.winner_name} Wins!</span>
        </div>
      )}

      {match.team2_id === null && (
        <div className="double-bye-notice">
          <span className="double-advance-icon">⚡</span>
          {match.team1_name} advances automatically
        </div>
      )}

      {match.status === 'ongoing' && (
        <div className="double-live-indicator">
          <span className="double-live-dot"></span>
          LIVE MATCH
        </div>
      )}
    </div>
  );

  // Function to render rounds for a bracket type
  const renderBracketSection = (rounds, matches, bracketType, title) => (
    <div className={`double-bracket-section ${bracketType}-bracket-section`} data-bracket-type={bracketType}>
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
            <div key={roundNumber} className="double-round" data-round={displayRoundNumber || 0}>
              <div className={`double-round-header ${bracketType}-round-header`}>
                <div className="double-round-number">{roundTitle}</div>
                <div className="double-round-subtitle">
                  {bracketType === 'championship' ? 'Final Match' :
                   bracketType === 'loser' && displayRoundNumber === 1 ? 'First LB Round' :
                   bracketType === 'loser' ? `LB Round ${displayRoundNumber}` :
                   displayRoundNumber === 1 ? 'First Round' :
                   `Round ${displayRoundNumber}`}
                </div>
              </div>
              <div className="double-matches">
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
        
        {/* Tournament Title */}
        <div className="double-tournament-title">
          Double Elimination Tournament
        </div>

        {/* Connection Lines */}
        <svg className="double-connection-lines" xmlns="http://www.w3.org/2000/svg">
          {connectionPoints.map((fromPoint, i) => {
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
          })}
        </svg>

        {/* Main Bracket Layout */}
        <div className="double-main-bracket-container">
          {/* Left Side - Winner's and Loser's Brackets */}
          <div className="double-left-brackets">
            {/* Winner's Bracket */}
            {winnerMatches.length > 0 && renderBracketSection(winnerRounds, winnerMatches, 'winner', null)}
            
            {/* Loser's Bracket */}
            {loserMatches.length > 0 && renderBracketSection(loserRounds, loserMatches, 'loser', null)}
          </div>

          {/* Right Side - Championship */}
          {championshipMatches.length > 0 && (
            <div className="double-right-championship">
              {renderBracketSection(['200'], championshipMatches, 'championship', 'Championship')}
            </div>
          )}
        </div>

        {(winnerRounds.length === 0 && loserRounds.length === 0) && (
          <div className="double-no-rounds">
            <div className="double-no-rounds-content">
              <div className="double-warning-icon">⚠️</div>
              <p>No tournament rounds found. Please check if matches were generated properly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubleEliminationBracket;