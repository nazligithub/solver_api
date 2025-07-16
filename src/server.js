require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler } = require('./utils/response');
const homeworkRoutes = require('./routes/homeworkRoutes');
const subjectsRoutes = require('./routes/subjectsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const appStatusRoutes = require('./routes/appStatusRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Homework API Server...');

app.use(helmet());
app.use(cors());
app.use(compression());

// Add request ID middleware
app.use((req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔍 Request ${req.method} ${req.path} [${req.id}]`);
  next();
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('🔗 Loading routes...');
app.use('/api/homework', homeworkRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/app', appStatusRoutes);
console.log('✅ Routes loaded');

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✨ Homework API Server ready on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('\n🔥 Server is running!\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error(error.stack);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});