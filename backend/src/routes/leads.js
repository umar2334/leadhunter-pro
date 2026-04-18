import express from 'express';
import { analyzeWebsite } from '../services/websiteAnalyzer.js';
import { generateOutreach } from '../services/geminiService.js';
import { supabase } from '../services/supabaseClient.js';
import { optionalAuth } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

const router = express.Router();
router.use(optionalAuth);

// POST /leads/extract
router.post('/extract', async (req, res, next) => {
  try {
    const lead = { ...req.body };
    const SOCIAL_DOMAINS = ['facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'snapchat.com'];
    const isSocialUrl = lead.website && SOCIAL_DOMAINS.some(d => lead.website.toLowerCase().includes(d));

    if (isSocialUrl) {
      lead.opportunity_type = 'no_website';
      lead.analysis = { exists: false, score: 0, issues: ['No real website — only a social media page'], summary: 'Business has no website, only a social media presence. High opportunity.', email: null };
      lead.analysis_score = 0;
      lead.analysis_issues = ['No real website — only a social media page'];
      lead.analysis_summary = 'Business has no website, only a social media presence. High opportunity.';
      lead.email = null;
      lead.website = null;
    } else if (lead.website) {
      lead.analysis = await analyzeWebsite(lead.website);
      const score = lead.analysis.score;
      lead.opportunity_type = score < 50 ? 'weak_website' : 'has_website';
      lead.analysis_score = score;
      lead.analysis_issues = lead.analysis.issues;
      lead.analysis_summary = lead.analysis.summary;
      lead.email = lead.analysis.email || null;
      lead.whatsapp_number = lead.analysis.whatsapp_number || null;
      lead.website_phone = lead.analysis.website_phone || null;
      lead.owner_name = lead.analysis.owner_name || null;

      // Flag phone mismatch: Maps phone ≠ website phone
      if (lead.phone && lead.website_phone) {
        const normalize = p => p.replace(/[\s\-().+]/g, '');
        const mapsNorm = normalize(lead.phone);
        const siteNorm = normalize(lead.website_phone);
        if (!mapsNorm.endsWith(siteNorm.slice(-8)) && !siteNorm.endsWith(mapsNorm.slice(-8))) {
          lead.analysis_issues = [
            `⚠️ Phone mismatch — Maps: ${lead.phone} vs Website: ${lead.website_phone}`,
            ...lead.analysis_issues,
          ];
        }
      }
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
    const row = {
      name: lead.name, phone: lead.phone || null, email: lead.email || null,
      website: lead.website || null, address: lead.address || null,
      category: lead.category || null, rating: lead.rating || null,
      review_count: lead.reviewCount || null, opportunity_type: lead.opportunity_type,
      analysis_score: lead.analysis_score ?? null, analysis_issues: lead.analysis_issues ?? [],
      analysis_summary: lead.analysis_summary ?? null, maps_url: lead.mapsUrl || null,
      status: 'new',
    };
    if (lead.whatsapp_number) row.whatsapp_number = lead.whatsapp_number;
    if (lead.website_phone) row.website_phone = lead.website_phone;
    if (lead.owner_name) row.owner_name = lead.owner_name;
    if (req.userId) row.user_id = req.userId;

    let { data, error } = await supabase.from('leads').upsert(row, { onConflict: 'maps_url', ignoreDuplicates: false }).select().single();
    // If new columns don't exist yet, retry without them
    if (error && error.message?.includes('column')) {
      delete row.whatsapp_number; delete row.website_phone; delete row.owner_name;
      ({ data, error } = await supabase.from('leads').upsert(row, { onConflict: 'maps_url', ignoreDuplicates: false }).select().single());
    }
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
      analysis_summary: lead.analysis_summary ?? null, maps_url: lead.mapsUrl || null,
      status: 'new',
    }));
    let { data, error } = await supabase.from('leads').upsert(rows, { onConflict: 'maps_url', ignoreDuplicates: true }).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, saved: data.length, leads: data });
  } catch (err) { next(err); }
});

// GET /leads/export.xlsx — Excel file
router.get('/export.xlsx', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const rows = data.map(l => ({
      'Business Name': l.name || '',
      'Email': l.email || '',
      'Phone': l.phone || '',
      'Website': l.website || '',
      'Address': l.address || '',
      'Category': l.category || '',
      'Rating': l.rating || '',
      'Reviews': l.review_count || '',
      'Opportunity': l.opportunity_type === 'no_website' ? '🔥 No Website'
        : l.opportunity_type === 'weak_website' ? '⚠️ Weak Website' : '✅ Has Website',
      'Website Score': l.analysis_score || '',
      'Website Issues': Array.isArray(l.analysis_issues) ? l.analysis_issues.join('; ') : '',
      'Summary': l.analysis_summary || '',
      'Status': l.status || '',
      'Date Added': l.created_at ? new Date(l.created_at).toLocaleDateString() : '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 30 },
      { wch: 30 }, { wch: 20 }, { wch: 8 }, { wch: 8 },
      { wch: 18 }, { wch: 12 }, { wch: 50 }, { wch: 50 },
      { wch: 12 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"');
    res.send(buf);
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
    if (req.userId) query = query.or(`user_id.eq.${req.userId},user_id.is.null`);
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
    let q = supabase.from('leads').select('opportunity_type, status');
    if (req.userId) q = q.or(`user_id.eq.${req.userId},user_id.is.null`);
    const { data, error } = await q;
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

// GET /leads/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('leads').select('created_at, opportunity_type, status, category, analysis_score').order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    // Daily counts — last 30 days
    const daily = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      daily[d.toISOString().slice(0, 10)] = 0;
    }
    data.forEach(l => { const k = l.created_at?.slice(0, 10); if (k && daily[k] !== undefined) daily[k]++; });

    // Category breakdown (top 8)
    const cats = {};
    data.forEach(l => { if (l.category) cats[l.category] = (cats[l.category] || 0) + 1; });
    const topCategories = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

    // Avg score
    const scored = data.filter(l => l.analysis_score !== null);
    const avgScore = scored.length ? Math.round(scored.reduce((s, l) => s + l.analysis_score, 0) / scored.length) : 0;

    res.json({
      daily: Object.entries(daily).map(([date, count]) => ({ date, count })),
      opportunity: {
        no_website: data.filter(l => l.opportunity_type === 'no_website').length,
        weak_website: data.filter(l => l.opportunity_type === 'weak_website').length,
        has_website: data.filter(l => l.opportunity_type === 'has_website').length,
      },
      status: {
        new: data.filter(l => l.status === 'new').length,
        contacted: data.filter(l => l.status === 'contacted').length,
        replied: data.filter(l => l.status === 'replied').length,
        converted: data.filter(l => l.status === 'converted').length,
        dead: data.filter(l => l.status === 'dead').length,
      },
      topCategories,
      avgScore,
      total: data.length,
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
    const allowed = ['status', 'notes', 'outreach_sent', 'follow_up_date', 'owner_name'];
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
