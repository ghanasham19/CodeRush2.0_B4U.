import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
import './config/firebaseAdmin.js'; 

// Import Routes
import uploadRoutes from './routes/uploadRoutes.js';

// ES Module fix for directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Essential Middlewares
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Serve the 'uploads' directory statically so PDFs can be downloaded/viewed
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register Routes
app.use('/api/upload', uploadRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'EvidenceHub AI Backend is operational.',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
});