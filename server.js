require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const User = require('./User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/claudia';

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'claudia-space-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(' Conectado a MongoDB');

    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'claudia' });
    if (!adminExists) {
      const admin = new User({
        username: 'claudia',
        password: 'root',
        role: 'admin'
      });
      await admin.save();
      console.log(' Usuario admin creado: claudia/root');
    }
  })
  .catch(err => console.error(' Error de conexión a MongoDB:', err));

// Record Schema
const recordSchema = new mongoose.Schema({
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  totalHoras: { type: Number, required: true },
  parador: { type: String, required: true },
  notas: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Record = mongoose.model('Record', recordSchema);

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Middleware to check admin role
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// ===== AUTH ROUTES =====

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/auth/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ===== USER MANAGEMENT ROUTES (Admin only) =====

// Get all users
app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Create user
app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const newUser = new User({ username, password, role });
    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      username: newUser.username,
      role: newUser.role
    });
  } catch (error) {
    res.status(400).json({ error: 'Error al crear usuario' });
  }
});

// Update user
app.put('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const updateData = { username, role };

    if (password) {
      const user = await User.findById(req.params.id);
      user.password = password;
      await user.save();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
});

// Delete user
app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ===== RECORD ROUTES =====

// GET all records (only user's records)
app.get('/api/records', isAuthenticated, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.session.userId })
      .sort({ fecha: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// POST new record
app.post('/api/records', isAuthenticated, async (req, res) => {
  try {
    const newRecord = new Record({
      ...req.body,
      userId: req.session.userId
    });
    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear registro' });
  }
});

// PUT update record
app.put('/api/records/:id', isAuthenticated, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar registro' });
  }
});

// DELETE record
app.delete('/api/records/:id', isAuthenticated, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    await Record.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar registro' });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
