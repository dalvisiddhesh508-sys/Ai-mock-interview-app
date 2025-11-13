require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');

// Hardcoded configuration
const PORT = 3000;
const JWT_SECRET = 'yourSuperSecretKeyChangeThisInProduction';

// OpenRouter API Key is now configured in services/geminiService.js
// Set via: OPENROUTER_API_KEY environment variable or update geminiService.js directly

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/interview', require('./routes/interviewRoutes'));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('🔗 Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Server startup with DB connection
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    const dbConnected = await connectDB();

    if (!dbConnected) {
      console.warn(
        '\n⚠️  Warning: MongoDB connection failed. Server starting in limited mode.'
      );
      console.warn(
        '   API endpoints that require database will not function properly.\n'
      );
    }

    // Attach error handlers for the server
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(
          `\n🚨 Port ${PORT} is already in use. Please stop the process using that port.`
        );
      } else {
        console.error('\n🚨 Server error:', err);
      }
      process.exit(1);
    });

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Local:   http://localhost:${PORT}`);
      console.log(`📍 Network: http://<your-ip>:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ Fatal error during startup:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

