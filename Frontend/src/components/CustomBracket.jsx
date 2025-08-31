import React from 'react';
import "../style/CustomBrackets.css";

const CustomBracket = ({ matches }) => {
  console.log("CustomBracket received matches:", matches);

  if (!matches || matches.length === 0) {
    return (
      <div className="no-matches">
        <h3>No matches generated yet</h3>
        <p>Generate matches first by creating a bracket with teams.</p>
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

  return (
    <div className="custom-bracket">
      <div className="bracket-container">
        {sortedRounds.map(roundNumber => (
          <div key={roundNumber} className="round">
            <div className="round-header">
              <h3>Round {roundNumber}</h3>
            </div>
            <div className="matches">
              {rounds[roundNumber].map(match => (
                <div key={match.id} className={`match ${match.status}`}>
                  <div className="match-info">
                    <span className="match-id">Match #{match.id}</span>
                    <span className={`match-status ${match.status}`}>
                      {match.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="teams">
                    <div className={`team team1 ${match.winner_id === match.team1_id ? 'winner' : ''}`}>
                      <span className="team-name">
                        {match.team1_name || 'TBD'}
                      </span>
                      {match.score_team1 !== null && match.score_team1 !== undefined && (
                        <span className="score">{match.score_team1}</span>
                      )}
                    </div>

                    <div className="vs-divider">
                      {match.team2_id ? 'VS' : 'BYE'}
                    </div>

                    <div className={`team team2 ${match.winner_id === match.team2_id ? 'winner' : ''}`}>
                      <span className="team-name">
                        {match.team2_name || (match.team2_id ? 'TBD' : '')}
                      </span>
                      {match.score_team2 !== null && match.score_team2 !== undefined && (
                        <span className="score">{match.score_team2}</span>
                      )}
                    </div>
                  </div>

                  {match.status === 'completed' && match.winner_name && (
                    <div className="match-winner">
                      🏆 Winner: {match.winner_name}
                    </div>
                  )}

                  {match.team2_id === null && (
                    <div className="bye-notice">
                      {match.team1_name} advances automatically
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
          <p>No rounds found. Check if matches were generated properly.</p>
        </div>
      )}
    </div>
  );
};

export default CustomBracket;