require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler } = require('./utils/response');
const homeworkRoutes = require('./routes/homeworkRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/admin/adminRoutes');
const appRoutes = require('./routes/appRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/homework', homeworkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/app', appRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Homework API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});