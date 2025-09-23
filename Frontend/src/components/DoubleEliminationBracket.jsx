import React, { useEffect, useRef, useState } from 'react';

const CustomBracket = ({ matches, eliminationType = 'single' }) => {
  const bracketRef = useRef(null);
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

  // Group matches by round
  const groupMatchesByRound = (matches) => {
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });
    return rounds;
  };

  const winnerRounds = groupMatchesByRound(winnerMatches);
  const loserRounds = groupMatchesByRound(loserMatches);

  // Calculate positions for tree structure
  const calculatePositions = () => {
    const positions = { winner: {}, loser: {}, championship: {} };
    
    // Winner bracket positions - tree structure
    const winnerRoundNumbers = Object.keys(winnerRounds).sort((a, b) => parseInt(a) - parseInt(b));
    const maxWinnerRounds = winnerRoundNumbers.length;
    
    winnerRoundNumbers.forEach((roundNum, roundIndex) => {
      const matchesInRound = winnerRounds[roundNum];
      const roundHeight = Math.pow(2, maxWinnerRounds - roundIndex) * 120;
      
      matchesInRound.forEach((match, matchIndex) => {
        const x = roundIndex * 350 + 50;
        const baseY = 150;
        const matchSpacing = roundHeight / (matchesInRound.length + 1);
        const y = baseY + (matchIndex + 1) * matchSpacing;
        
        positions.winner[match.id] = { x, y, roundIndex, matchIndex };
      });
    });

    // Loser bracket positions - tree structure below winner bracket
    const loserRoundNumbers = Object.keys(loserRounds).sort((a, b) => parseInt(a) - parseInt(b));
    const maxLoserRounds = loserRoundNumbers.length;
    
    loserRoundNumbers.forEach((roundNum, roundIndex) => {
      const matchesInRound = loserRounds[roundNum];
      const roundHeight = Math.pow(2, maxLoserRounds - roundIndex) * 100;
      
      matchesInRound.forEach((match, matchIndex) => {
        const x = roundIndex * 350 + 50;
        const baseY = 500; // Position below winner bracket
        const matchSpacing = roundHeight / (matchesInRound.length + 1);
        const y = baseY + (matchIndex + 1) * matchSpacing;
        
        positions.loser[match.id] = { x, y, roundIndex, matchIndex };
      });
    });

    // Championship position - centered to the right
    if (championshipMatches.length > 0) {
      const finalX = Math.max(
        ...Object.values(positions.winner).map(p => p.x),
        ...Object.values(positions.loser).map(p => p.x)
      ) + 350;
      
      positions.championship[championshipMatches[0].id] = { 
        x: finalX, 
        y: 325, // Center between winner and loser brackets
        roundIndex: 0, 
        matchIndex: 0 
      };
    }

    return positions;
  };

  const positions = calculatePositions();

  // Render match component with consistent styling
  const renderMatch = (match, position, bracketType = 'winner') => (
    <div
      key={match.id}
      className={`match ${match.status} ${bracketType}-match`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '300px',
        transform: 'translateY(-50%)', // Center vertically on the position
        zIndex: 10
      }}
      data-match-id={match.id}
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

  // Generate connection lines between matches
  const renderConnectionLines = () => {
    const lines = [];

    // Winner bracket connections
    Object.keys(winnerRounds).forEach(roundNum => {
      const roundInt = parseInt(roundNum);
      const currentMatches = winnerRounds[roundNum];
      const nextRoundMatches = winnerRounds[roundInt + 1] || [];

      currentMatches.forEach((match, index) => {
        const currentPos = positions.winner[match.id];
        const nextMatchIndex = Math.floor(index / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch && positions.winner[nextMatch.id]) {
          const nextPos = positions.winner[nextMatch.id];
          const fromX = currentPos.x + 300;
          const fromY = currentPos.y;
          const toX = nextPos.x;
          const toY = nextPos.y;
          const midX = (fromX + toX) / 2;

          lines.push(
            <g key={`winner-${match.id}-${index}`} className="connection-path">
              <line x1={fromX} y1={fromY} x2={midX} y2={fromY} stroke="#4dabf7" strokeWidth="3" />
              <line x1={midX} y1={fromY} x2={midX} y2={toY} stroke="#4dabf7" strokeWidth="3" />
              <line x1={midX} y1={toY} x2={toX} y2={toY} stroke="#4dabf7" strokeWidth="3" />
              <circle cx={fromX} cy={fromY} r="4" fill="#4dabf7" className="connection-dot" />
              <circle cx={toX} cy={toY} r="4" fill="#4dabf7" className="connection-dot" />
            </g>
          );
        }
      });
    });

    // Loser bracket connections
    Object.keys(loserRounds).forEach(roundNum => {
      const roundInt = parseInt(roundNum);
      const currentMatches = loserRounds[roundNum];
      const nextRoundMatches = loserRounds[roundInt + 1] || [];

      currentMatches.forEach((match, index) => {
        const currentPos = positions.loser[match.id];
        const nextMatchIndex = Math.floor(index / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch && positions.loser[nextMatch.id]) {
          const nextPos = positions.loser[nextMatch.id];
          const fromX = currentPos.x + 300;
          const fromY = currentPos.y;
          const toX = nextPos.x;
          const toY = nextPos.y;
          const midX = (fromX + toX) / 2;

          lines.push(
            <g key={`loser-${match.id}-${index}`} className="connection-path">
              <line x1={fromX} y1={fromY} x2={midX} y2={fromY} stroke="#ff6b6b" strokeWidth="3" />
              <line x1={midX} y1={fromY} x2={midX} y2={toY} stroke="#ff6b6b" strokeWidth="3" />
              <line x1={midX} y1={toY} x2={toX} y2={toY} stroke="#ff6b6b" strokeWidth="3" />
              <circle cx={fromX} cy={fromY} r="4" fill="#ff6b6b" className="connection-dot" />
              <circle cx={toX} cy={toY} r="4" fill="#ff6b6b" className="connection-dot" />
            </g>
          );
        }
      });
    });

    // Championship connections
    if (championshipMatches.length > 0) {
      const champPos = positions.championship[championshipMatches[0].id];
      
      // Connect from winner bracket final
      const winnerFinalRound = Math.max(...Object.keys(winnerRounds).map(Number));
      const winnerFinalMatches = winnerRounds[winnerFinalRound];
      if (winnerFinalMatches && winnerFinalMatches.length > 0) {
        const winnerFinalPos = positions.winner[winnerFinalMatches[0].id];
        lines.push(
          <g key="champ-winner-connection" className="connection-path">
            <line 
              x1={winnerFinalPos.x + 300} 
              y1={winnerFinalPos.y} 
              x2={champPos.x} 
              y2={champPos.y} 
              stroke="#ffd700" 
              strokeWidth="3" 
            />
            <circle cx={winnerFinalPos.x + 300} cy={winnerFinalPos.y} r="4" fill="#ffd700" />
            <circle cx={champPos.x} cy={champPos.y} r="4" fill="#ffd700" />
          </g>
        );
      }

      // Connect from loser bracket final if exists
      const loserFinalRound = Math.max(...Object.keys(loserRounds).map(Number));
      const loserFinalMatches = loserRounds[loserFinalRound];
      if (loserFinalMatches && loserFinalMatches.length > 0) {
        const loserFinalPos = positions.loser[loserFinalMatches[0].id];
        lines.push(
          <g key="champ-loser-connection" className="connection-path">
            <line 
              x1={loserFinalPos.x + 300} 
              y1={loserFinalPos.y} 
              x2={champPos.x} 
              y2={champPos.y} 
              stroke="#ffd700" 
              strokeWidth="3" 
            />
            <circle cx={loserFinalPos.x + 300} cy={loserFinalPos.y} r="4" fill="#ffd700" />
            <circle cx={champPos.x} cy={champPos.y} r="4" fill="#ffd700" />
          </g>
        );
      }
    }

    return lines;
  };

  // Calculate container dimensions
  const allPositions = [...Object.values(positions.winner), ...Object.values(positions.loser), ...Object.values(positions.championship)];
  const maxX = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.x)) + 400 : 0;
  const maxY = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.y)) + 200 : 0;

  return (
    <div className="enhanced-bracket-wrapper" style={{ minHeight: maxY + 'px' }}>
      <div className="enhanced-bracket" ref={bracketRef}>
        
        {/* Tournament Title */}
        <div className="tournament-title">
          Double Elimination Tournament
        </div>

        {/* Bracket Labels */}
        <div className="bracket-label winner-label">
          Winner Bracket
        </div>

        {loserMatches.length > 0 && (
          <div className="bracket-label loser-label">
            Loser Bracket
          </div>
        )}

        {championshipMatches.length > 0 && (
          <div className="bracket-label championship-label">
            Championship
          </div>
        )}

        {/* Main container */}
        <div className="bracket-container" style={{
          width: maxX + 'px',
          height: maxY + 'px'
        }}>
          
          {/* Connection Lines SVG */}
          <svg className="connection-lines" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}>
            {renderConnectionLines()}
          </svg>

          {/* Render all matches */}
          {Object.entries(positions.winner).map(([matchId, position]) => {
            const match = winnerMatches.find(m => m.id === parseInt(matchId));
            return match ? renderMatch(match, position, 'winner') : null;
          })}

          {Object.entries(positions.loser).map(([matchId, position]) => {
            const match = loserMatches.find(m => m.id === parseInt(matchId));
            return match ? renderMatch(match, position, 'loser') : null;
          })}

          {Object.entries(positions.championship).map(([matchId, position]) => {
            const match = championshipMatches.find(m => m.id === parseInt(matchId));
            return match ? renderMatch(match, position, 'championship') : null;
          })}
        </div>
      </div>

      <style jsx>{`
        .enhanced-bracket-wrapper {
          padding: 32px;
          background: linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%);
          border-radius: 16px;
          position: relative;
          overflow: auto;
          min-height: 600px;
        }

        .tournament-title {
          text-align: center;
          margin-bottom: 30px;
          color: white;
          font-size: 2em;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .bracket-label {
          position: absolute;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1em;
          z-index: 20;
          color: white;
        }

        .winner-label {
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #4dabf7, #1976d2);
        }

        .loser-label {
          top: 480px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #ff6b6b, #d32f2f);
        }

        .championship-label {
          top: 300px;
          right: 50px;
          background: linear-gradient(135deg, #ffd700, #f57f17);
          color: #000;
        }

        .bracket-container {
          position: relative;
          margin: 0 auto;
        }

        .match {
          background: rgba(15, 23, 42, 0.85);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
          cursor: pointer;
        }

        .match:hover {
          transform: translateY(-4px) scale(1.02) translateY(-50%);
          box-shadow: 0 20px 40px rgba(0,0,0,0.35), 0 5px 15px rgba(0,0,0,0.2);
        }

        .loser-match {
          border-color: rgba(255, 107, 107, 0.3);
        }

        .championship-match {
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 0 20px rgba(255, 215, 0, 0.3);
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

        @keyframes pulseMatch {
          0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 10px 30px rgba(0,0,0,0.25), 0 0 20px rgba(245, 158, 11, 0.3); }
        }

        .match-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .match-id {
          font-weight: 600;
          color: #e0e0e0;
          font-size: 0.9em;
        }

        .match-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .match-status.scheduled {
          background: linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%);
          color: white;
        }

        .match-status.ongoing {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
          color: white;
        }

        .match-status.completed {
          background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
          color: white;
        }

        .teams-container {
          margin-bottom: 16px;
        }

        .team {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          margin: 6px 0;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          color: #e0e0e0;
          transition: all 0.3s ease;
        }

        .team.winner {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
          border-color: rgba(34, 197, 94, 0.5);
          color: #a7f3d0;
          transform: scale(1.02);
        }

        .team-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .team-name {
          font-size: 1.05em;
          color: #ffffff;
          font-weight: 600;
        }

        .winner-crown {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }

        .score {
          background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 700;
          min-width: 40px;
          text-align: center;
        }

        .loser-match .score {
          background: linear-gradient(135deg, #7e1a1a 0%, #933928 100%);
        }

        .championship-match .score {
          background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
        }

        .vs-divider {
          text-align: center;
          padding: 12px;
        }

        .vs-text, .bye-text {
          background: linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8em;
          display: inline-block;
        }

        .loser-match .vs-text,
        .loser-match .bye-text {
          background: linear-gradient(135deg, #c05c5c 0%, #ab3939 100%);
        }

        .championship-match .vs-text,
        .championship-match .bye-text {
          background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
        }

        .match-result {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 10px;
          font-weight: 600;
          color: #a7f3d0;
        }

        .trophy-icon {
          font-size: 1.2em;
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(10deg); }
          100% { transform: rotate(0deg); }
        }

        .bye-notice {
          margin-top: 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(92, 107, 192, 0.1) 0%, rgba(92, 107, 192, 0.05) 100%);
          border: 1px solid rgba(92, 107, 192, 0.2);
          border-radius: 8px;
          text-align: center;
          font-style: italic;
          color: #c5cae9;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
          padding: 8px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #f87171;
          font-weight: 600;
          font-size: 0.85em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: livePulse 1.5s infinite ease-in-out;
        }

        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        .connection-path {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .connection-dot {
          animation: pulse 2s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default CustomBracket;