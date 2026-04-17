import express from 'express';
import { analyzeWebsite } from '../services/websiteAnalyzer.js';
import { generateOutreach } from '../services/geminiService.js';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// POST /leads/extract — called by Chrome extension
// Receives raw Maps data, adds website analysis, returns enriched lead (not saved yet)
router.post('/extract', async (req, res, next) => {
  try {
    const lead = { ...req.body };

    if (lead.website) {
      lead.analysis = await analyzeWebsite(lead.website);
      const score = lead.analysis.score;
      lead.opportunity_type = score < 50 ? 'weak_website' : 'has_website';
      lead.analysis_score = score;
      lead.analysis_issues = lead.analysis.issues;
      lead.analysis_summary = lead.analysis.summary;
    } else {
      lead.opportunity_type = 'no_website';
      lead.analysis = {
        exists: false,
        score: 0,
        issues: ['No website found'],
        summary: 'Business has no website — high opportunity for a new build.',
      };
      lead.analysis_score = 0;
      lead.analysis_issues = ['No website found'];
      lead.analysis_summary = 'Business has no website — high opportunity for a new build.';
    }

    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// POST /leads/save — save enriched lead to Supabase
router.post('/save', async (req, res, next) => {
  try {
    const lead = req.body;

    const { data, error } = await supabase
      .from('leads')
      .upsert(
        {
          name: lead.name,
          phone: lead.phone || null,
          website: lead.website || null,
          address: lead.address || null,
          category: lead.category || null,
          rating: lead.rating || null,
          review_count: lead.reviewCount || null,
          opportunity_type: lead.opportunity_type,
          analysis_score: lead.analysis_score ?? null,
          analysis_issues: lead.analysis_issues ?? [],
          analysis_summary: lead.analysis_summary ?? null,
          maps_url: lead.mapsUrl || null,
          status: 'new',
        },
        { onConflict: 'maps_url', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, lead: data });
  } catch (err) {
    next(err);
  }
});

// GET /leads — fetch all leads with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { opportunity_type, category, status, search, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (opportunity_type) query = query.eq('opportunity_type', opportunity_type);
    if (category) query = query.ilike('category', `%${category}%`);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({ leads: data, total: count });
  } catch (err) {
    next(err);
  }
});

// GET /leads/stats — dashboard summary numbers
router.get('/stats', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('opportunity_type, status');

    if (error) return res.status(500).json({ error: error.message });

    const stats = {
      total: data.length,
      no_website: data.filter(l => l.opportunity_type === 'no_website').length,
      weak_website: data.filter(l => l.opportunity_type === 'weak_website').length,
      has_website: data.filter(l => l.opportunity_type === 'has_website').length,
      new: data.filter(l => l.status === 'new').length,
      contacted: data.filter(l => l.status === 'contacted').length,
      converted: data.filter(l => l.status === 'converted').length,
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /leads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Lead not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /leads/:id — update status or notes
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'notes', 'outreach_sent'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /leads/:id/outreach — generate AI messages
router.post('/:id/outreach', async (req, res, next) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Lead not found' });

    const messages = await generateOutreach(lead);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// DELETE /leads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
