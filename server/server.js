require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminUserRoutes = require('./routes/admin/users');
const adminElectionRoutes = require('./routes/admin/elections');
const adminPositionRoutes = require('./routes/admin/positions');
const adminCandidateRoutes = require('./routes/admin/candidates');
const electionRoutes = require('./routes/elections');
const positionRoutes = require('./routes/positions');
const candidateRoutes = require('./routes/candidates');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/elections', adminElectionRoutes);
app.use('/api/admin', adminPositionRoutes);
app.use('/api/admin/candidates', adminCandidateRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/elections', positionRoutes);
app.use('/api/elections', candidateRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
