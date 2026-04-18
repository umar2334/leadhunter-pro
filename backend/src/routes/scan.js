import express from 'express';
import fetch from 'node-fetch';
import { supabase } from '../services/supabaseClient.js';
import { analyzeWebsite } from '../services/websiteAnalyzer.js';

const router = express.Router();

const DEFAULT_SEARCHES = [
  { term: 'restaurants', location: 'Dubai, UAE' },
  { term: 'clinics', location: 'Dubai, UAE' },
  { term: 'salons', location: 'Dubai, UAE' },
  { term: 'gyms', location: 'Dubai, UAE' },
  { term: 'real estate', location: 'Dubai, UAE' },
];

const SOCIAL_DOMAINS = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com'];

async function searchGooglePlaces(term, location) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const query = `${term} in ${location}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const res = await fetch(url, { timeout: 10000 });
    const data = await res.json();
    return (data.results || []).map(p => ({
      name: p.name,
      address: p.formatted_address || null,
      rating: p.rating || null,
      reviewCount: p.user_ratings_total || null,
      category: term,
      phone: null,
      website: null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      place_id: p.place_id,
    }));
  } catch { return []; }
}

async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return {};
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website&key=${apiKey}`;
    const res = await fetch(url, { timeout: 8000 });
    const data = await res.json();
    return {
      phone: data.result?.formatted_phone_number || null,
      website: data.result?.website || null,
    };
  } catch { return {}; }
}

// POST /scan/run — triggered by cron or manually
router.post('/run', async (req, res, next) => {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return res.status(400).json({ error: 'GOOGLE_PLACES_API_KEY not set. Add it in Railway variables.' });
    }

    const searches = req.body.searches || DEFAULT_SEARCHES;
    let totalSaved = 0;
    const results = [];

    for (const { term, location } of searches.slice(0, 5)) {
      const places = await searchGooglePlaces(term, location);

      for (const place of places.slice(0, 10)) {
        try {
          const details = await getPlaceDetails(place.place_id);
          place.phone = details.phone || null;
          place.website = details.website || null;

          const isSocial = place.website && SOCIAL_DOMAINS.some(d => place.website.includes(d));
          if (isSocial) { place.website = null; place.opportunity_type = 'no_website'; }

          let analysis = { score: 0, issues: ['Auto-scanned — website not analyzed yet'], summary: '', email: null, whatsapp_number: null, website_phone: null, owner_name: null };
          if (place.website && !isSocial) {
            try { analysis = await analyzeWebsite(place.website); } catch {}
          }

          const row = {
            name: place.name,
            phone: place.phone,
            email: analysis.email,
            website: place.website,
            address: place.address,
            category: place.category,
            rating: place.rating,
            review_count: place.reviewCount,
            opportunity_type: place.website ? (analysis.score < 50 ? 'weak_website' : 'has_website') : 'no_website',
            analysis_score: analysis.score,
            analysis_issues: analysis.issues,
            analysis_summary: analysis.summary,
            maps_url: place.mapsUrl,
            status: 'new',
          };

          const { error } = await supabase.from('leads').upsert(row, { onConflict: 'maps_url', ignoreDuplicates: true });
          if (!error) totalSaved++;
        } catch {}
      }

      results.push({ term, location, found: places.length });
    }

    res.json({ success: true, saved: totalSaved, searches: results, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});

// GET /scan/status
router.get('/status', (req, res) => {
  res.json({
    google_places_configured: !!process.env.GOOGLE_PLACES_API_KEY,
    default_searches: DEFAULT_SEARCHES,
  });
});

export default router;
