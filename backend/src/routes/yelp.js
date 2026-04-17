import express from 'express';
import fetch from 'node-fetch';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// GET /yelp/search?term=restaurants&location=Dubai&limit=20
router.get('/search', async (req, res, next) => {
  try {
    const { term, location = 'Dubai, UAE', limit = 20 } = req.query;
    if (!term) return res.status(400).json({ error: 'term is required' });

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Yelp API key not configured' });

    const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=${Math.min(Number(limit), 50)}`;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const yelpRes = await fetch(url, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    clearTimeout(tid);

    if (!yelpRes.ok) {
      const err = await yelpRes.json().catch(() => ({}));
      return res.status(yelpRes.status).json({ error: err.error?.description || 'Yelp API error' });
    }

    const data = await yelpRes.json();

    const businesses = (data.businesses || []).map(b => ({
      name: b.name,
      phone: b.display_phone || b.phone || null,
      address: b.location?.display_address?.join(', ') || null,
      category: b.categories?.[0]?.title || null,
      rating: b.rating || null,
      reviewCount: b.review_count || null,
      website: null,
      yelp_url: b.url || null,
      mapsUrl: b.url || null,
      opportunity_type: 'no_website',
      analysis_score: 0,
      analysis_issues: ['Yelp lead — website not analyzed yet'],
      analysis_summary: 'Extracted from Yelp search. Open lead to analyze website.',
      source: 'yelp',
    }));

    res.json({ businesses, total: data.total || businesses.length });
  } catch (err) { next(err); }
});

// POST /yelp/save-bulk — save Yelp leads to Supabase
router.post('/save-bulk', async (req, res, next) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) return res.status(400).json({ error: 'leads array required' });

    const rows = leads.map(lead => ({
      name: lead.name,
      phone: lead.phone || null,
      email: null,
      website: null,
      address: lead.address || null,
      category: lead.category || null,
      rating: lead.rating || null,
      review_count: lead.reviewCount || null,
      opportunity_type: 'no_website',
      analysis_score: 0,
      analysis_issues: ['Yelp lead — website not analyzed yet'],
      analysis_summary: 'Extracted from Yelp. Open lead detail to run full analysis.',
      maps_url: lead.yelp_url || null,
      status: 'new',
    }));

    const { data, error } = await supabase
      .from('leads')
      .upsert(rows, { onConflict: 'maps_url', ignoreDuplicates: true })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, saved: data.length });
  } catch (err) { next(err); }
});

export default router;
