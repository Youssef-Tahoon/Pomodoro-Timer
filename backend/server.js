const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Path to store sessions data
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load sessions from file
async function loadSessions() {
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

// Save sessions to file
async function saveSessions(sessions) {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Routes

// GET /api/sessions - Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await loadSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error loading sessions:', error);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// GET /api/sessions/today - Get today's sessions
app.get('/api/sessions/today', async (req, res) => {
  try {
    const sessions = await loadSessions();
    const today = getTodayDate();
    
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate === today;
    });
    
    res.json({
      date: today,
      sessions: todaySessions,
      totalSessions: todaySessions.length,
      totalMinutes: todaySessions.reduce((total, session) => total + session.duration, 0)
    });
  } catch (error) {
    console.error('Error loading today\'s sessions:', error);
    res.status(500).json({ error: 'Failed to load today\'s sessions' });
  }
});

// POST /api/sessions - Create a new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { startTime, endTime, duration, type } = req.body;
    
    // Validate required fields
    if (!startTime || !endTime || !duration || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: startTime, endTime, duration, type' 
      });
    }
    
    const sessions = await loadSessions();
    
    const newSession = {
      id: Date.now().toString(), // Simple ID generation
      startTime,
      endTime,
      duration,
      type,
      createdAt: new Date().toISOString()
    };
    
    sessions.push(newSession);
    await saveSessions(sessions);
    
    console.log(`New ${type} session saved:`, {
      duration: `${duration} minutes`,
      time: new Date(startTime).toLocaleTimeString()
    });
    
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions/stats - Get session statistics
app.get('/api/sessions/stats', async (req, res) => {
  try {
    const sessions = await loadSessions();
    const today = getTodayDate();
    
    // Calculate stats
    const todaySessions = sessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate === today;
    });
    
    const totalSessions = sessions.length;
    const totalTodaySessions = todaySessions.length;
    const totalMinutesToday = todaySessions.reduce((total, session) => total + session.duration, 0);
    const totalMinutesAllTime = sessions.reduce((total, session) => total + session.duration, 0);
    
    // Group sessions by date for weekly view
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    });
    
    res.json({
      today: {
        date: today,
        sessions: totalTodaySessions,
        minutes: totalMinutesToday
      },
      allTime: {
        sessions: totalSessions,
        minutes: totalMinutesAllTime
      },
      sessionsByDate
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// DELETE /api/sessions/:id - Delete a specific session
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await loadSessions();
    
    const sessionIndex = sessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const deletedSession = sessions.splice(sessionIndex, 1)[0];
    await saveSessions(sessions);
    
    res.json({ message: 'Session deleted successfully', session: deletedSession });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Pomodoro Timer Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
      console.log(`🍅 Pomodoro Timer Backend running on port ${PORT}`);
      console.log(`📁 Data directory: ${DATA_DIR}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 API endpoints:`);
      console.log(`   GET /api/sessions - Get all sessions`);
      console.log(`   GET /api/sessions/today - Get today's sessions`);
      console.log(`   GET /api/sessions/stats - Get statistics`);
      console.log(`   POST /api/sessions - Create new session`);
      console.log(`   DELETE /api/sessions/:id - Delete session`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
