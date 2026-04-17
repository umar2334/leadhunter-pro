import express from 'express';
import { analyzeWebsite } from '../services/websiteAnalyzer.js';
import { generateOutreach } from '../services/geminiService.js';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// POST /leads/extract
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
      lead.email = lead.analysis.email || null;
    } else {
      lead.opportunity_type = 'no_website';
      lead.analysis = { exists: false, score: 0, issues: ['No website found'], summary: 'Business has no website — high opportunity for a new build.', email: null };
      lead.analysis_score = 0;
      lead.analysis_issues = ['No website found'];
      lead.analysis_summary = 'Business has no website — high opportunity for a new build.';
      lead.email = null;
    }
    res.json(lead);
  } catch (err) { next(err); }
});

// POST /leads/save
router.post('/save', async (req, res, next) => {
  try {
    const lead = req.body;
    const { data, error } = await supabase.from('leads').upsert({
      name: lead.name, phone: lead.phone || null, email: lead.email || null,
      website: lead.website || null, address: lead.address || null,
      category: lead.category || null, rating: lead.rating || null,
      review_count: lead.reviewCount || null, opportunity_type: lead.opportunity_type,
      analysis_score: lead.analysis_score ?? null, analysis_issues: lead.analysis_issues ?? [],
      analysis_summary: lead.analysis_summary ?? null, maps_url: lead.mapsUrl || null, status: 'new',
    }, { onConflict: 'maps_url', ignoreDuplicates: false }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, lead: data });
  } catch (err) { next(err); }
});

// POST /leads/bulk-save
router.post('/bulk-save', async (req, res, next) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) return res.status(400).json({ error: 'leads array required' });
    const rows = leads.map(lead => ({
      name: lead.name, phone: lead.phone || null, email: lead.email || null,
      website: lead.website || null, address: lead.address || null,
      category: lead.category || null, rating: lead.rating || null,
      review_count: lead.reviewCount || null,
      opportunity_type: lead.opportunity_type || 'no_website',
      analysis_score: lead.analysis_score ?? null, analysis_issues: lead.analysis_issues ?? [],
      analysis_summary: lead.analysis_summary ?? null, maps_url: lead.mapsUrl || null, status: 'new',
    }));
    const { data, error } = await supabase.from('leads').upsert(rows, { onConflict: 'maps_url', ignoreDuplicates: true }).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, saved: data.length, leads: data });
  } catch (err) { next(err); }
});

// GET /leads/export.csv
router.get('/export.csv', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const cols = ['name','email','phone','website','address','category','rating','review_count','opportunity_type','analysis_score','analysis_summary','status','created_at'];
    const esc = (v) => { if (v == null) return ''; const s = Array.isArray(v) ? v.join('; ') : String(v); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [cols.join(','), ...data.map(row => cols.map(c => esc(row[c])).join(','))];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

// GET /leads
router.get('/', async (req, res, next) => {
  try {
    const { opportunity_type, category, status, search, limit = 100, offset = 0 } = req.query;
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false }).range(Number(offset), Number(offset) + Number(limit) - 1);
    if (opportunity_type) query = query.eq('opportunity_type', opportunity_type);
    if (category) query = query.ilike('category', `%${category}%`);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ leads: data, total: count });
  } catch (err) { next(err); }
});

// GET /leads/stats
router.get('/stats', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leads').select('opportunity_type, status');
    if (error) return res.status(500).json({ error: error.message });
    res.json({
      total: data.length,
      no_website: data.filter(l => l.opportunity_type === 'no_website').length,
      weak_website: data.filter(l => l.opportunity_type === 'weak_website').length,
      has_website: data.filter(l => l.opportunity_type === 'has_website').length,
      new: data.filter(l => l.status === 'new').length,
      contacted: data.filter(l => l.status === 'contacted').length,
      converted: data.filter(l => l.status === 'converted').length,
    });
  } catch (err) { next(err); }
});

// GET /leads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Lead not found' });
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /leads/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['status', 'notes', 'outreach_sent'];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    const { data, error } = await supabase.from('leads').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
});

// POST /leads/:id/outreach
router.post('/:id/outreach', async (req, res, next) => {
  try {
    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Lead not found' });
    const messages = await generateOutreach(lead);
    res.json(messages);
  } catch (err) { next(err); }
});

// DELETE /leads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
