import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import './config/firebaseAdmin.js'; 
import uploadRoutes from './routes/uploadRoutes.js';
import aiRoutes from './routes/aiRoutes.js'; // <-- NEW

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes); // <-- NEW

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success' });
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
});