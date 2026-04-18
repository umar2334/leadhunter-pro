import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import leadsRouter from './routes/leads.js';
import analyzeRouter from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://leadhunter-pro-pied.vercel.app',
    'https://leadhunter-dashboard.vercel.app',
    'http://localhost:3000',
    'chrome-extension://*',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/leads', leadsRouter);
app.use('/analyze', analyzeRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`LeadHunter API running on :${PORT}`));
