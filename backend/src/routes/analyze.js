import express from 'express';
import { analyzeWebsite } from '../services/websiteAnalyzer.js';

const router = express.Router();

// POST /analyze — standalone URL analysis (used by dashboard "re-analyze" button)
router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await analyzeWebsite(url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
