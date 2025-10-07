// routes/stats_users.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all teams with statistics
router.get('/user-stats/teams', async (req, res) => {
  try {
    console.log('=== FETCHING TEAMS STATS ===');
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.sport,
        COUNT(DISTINCT CASE 
          WHEN m.winner_id = t.id THEN m.id 
        END) as wins,
        COUNT(DISTINCT CASE 
          WHEN (m.team1_id = t.id OR m.team2_id = t.id) 
          AND m.winner_id IS NOT NULL 
          AND m.winner_id != t.id 
          THEN m.id 
        END) as losses,
        'active' as status
      FROM teams t
      LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) 
        AND m.status = 'completed'
      GROUP BY t.id, t.name, t.sport
      ORDER BY wins DESC, t.name ASC
    `;
    
    const [teams] = await db.pool.query(query);
    
    console.log('✅ Teams fetched:', teams.length);
    
    // Calculate ranks per sport
    const sportsRanks = {};
    teams.forEach(team => {
      if (!sportsRanks[team.sport]) {
        sportsRanks[team.sport] = [];
      }
      sportsRanks[team.sport].push(team);
    });
    
    // Assign ranks
    Object.keys(sportsRanks).forEach(sport => {
      sportsRanks[sport]
        .sort((a, b) => b.wins - a.wins)
        .forEach((team, index) => {
          team.rank = index + 1;
        });
    });
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams statistics',
      details: error.message 
    });
  }
});

// GET team statistics summary
router.get('/user-stats/teams/:teamId/stats-summary', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log('=== STATS SUMMARY DEBUG ===');
    console.log('Fetching stats summary for team ID:', teamId);
    
    // Get team info
    const [teamInfo] = await db.pool.query(
      'SELECT id, name, sport FROM teams WHERE id = ?',
      [teamId]
    );
    
    if (teamInfo.length === 0) {
      console.log('❌ No team found with ID:', teamId);
      return res.status(404).json({ 
        error: 'Team not found',
        requestedId: teamId
      });
    }
    
    // Get all players for this team with their aggregated stats
    const query = `
      SELECT 
        p.id,
        p.name,
        p.position,
        p.jersey_number as jersey,
        COUNT(DISTINCT ps.match_id) as games_played,
        COALESCE(SUM(ps.points), 0) as points,
        COALESCE(SUM(ps.assists), 0) as assists,
        COALESCE(SUM(ps.rebounds), 0) as rebounds,
        COALESCE(SUM(ps.three_points_made), 0) as three_pointers_made,
        COALESCE(SUM(ps.steals), 0) as steals,
        COALESCE(SUM(ps.blocks), 0) as blocks,
        COALESCE(SUM(ps.fouls), 0) as fouls,
        COALESCE(SUM(ps.turnovers), 0) as turnovers,
        COALESCE(SUM(ps.kills), 0) as kills,
        COALESCE(SUM(ps.attack_attempts), 0) as kill_attempts,
        COALESCE(SUM(ps.attack_errors), 0) as kill_errors,
        COALESCE(SUM(ps.volleyball_assists), 0) as assists_volleyball,
        COALESCE(SUM(ps.service_aces), 0) as service_aces,
        COALESCE(SUM(ps.serve_errors), 0) as service_errors,
        COALESCE(SUM(ps.serves), 0) as service_attempts,
        COALESCE(SUM(ps.digs), 0) as digs,
        COALESCE(SUM(ps.blocks), 0) as blocks_volleyball,
        COALESCE(SUM(ps.receptions), 0) as reception_attempts,
        COALESCE(SUM(ps.reception_errors), 0) as reception_errors
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id
      LEFT JOIN matches m ON ps.match_id = m.id AND m.status = 'completed'
      WHERE p.team_id = ?
      GROUP BY p.id, p.name, p.position, p.jersey_number
      ORDER BY p.name ASC
    `;
    
    const [playerStats] = await db.pool.query(query, [teamId]);
    
    console.log('Player stats fetched:', playerStats.length);
    
    res.json({
      team: teamInfo[0],
      players: playerStats
    });
  } catch (error) {
    console.error('Error fetching team stats summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team statistics',
      details: error.message 
    });
  }
});

module.exports = router;