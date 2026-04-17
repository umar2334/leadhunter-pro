import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

const FETCH_TIMEOUT = 10000;

export async function analyzeWebsite(rawUrl) {
  const report = {
    exists: false,
    score: 0,
    issues: [],
    summary: '',
    score_breakdown: {},
    email: null,
  };

  let url = rawUrl.trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'www.google.com' && parsed.searchParams.get('q')) {
      url = parsed.searchParams.get('q');
    }
  } catch {}

  let html = '';
  let finalUrl = url;

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadHunterBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(tid);

    if (!res.ok) {
      report.summary = `Website returned HTTP ${res.status} — may be broken.`;
      report.issues.push(`HTTP error: ${res.status}`);
      return report;
    }

    finalUrl = res.url;
    html = await res.text();
    report.exists = true;
    report.score_breakdown.reachable = true;
  } catch (err) {
    report.summary = 'Website is unreachable or does not exist.';
    report.issues.push('Website is unreachable');
    return report;
  }

  const $ = cheerio.load(html);

  // ── Email extraction ──────────────────────────────────────────────────────
  const emailSet = new Set();
  const SPAM = ['example', 'sentry', 'wixpress', 'schema.org', 'email@', '@email', 'your@', '@your', 'domain'];

  // mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    const raw = $(el).attr('href').replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (raw.includes('@') && !SPAM.some(s => raw.includes(s))) emailSet.add(raw);
  });

  // regex scan in raw HTML (catches obfuscated emails too)
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  for (const match of (html.match(emailRegex) || [])) {
    const e = match.toLowerCase();
    if (!SPAM.some(s => e.includes(s)) && e.length < 60) emailSet.add(e);
  }

  report.email = [...emailSet][0] || null;

  // If no email on homepage, try /contact page
  if (!report.email) {
    try {
      const contactUrl = new URL('/contact', finalUrl).href;
      const controller2 = new AbortController();
      const tid2 = setTimeout(() => controller2.abort(), 6000);
      const res2 = await fetch(contactUrl, {
        signal: controller2.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadHunterBot/1.0)' },
      });
      clearTimeout(tid2);
      if (res2.ok) {
        const html2 = await res2.text();
        for (const match of (html2.match(emailRegex) || [])) {
          const e = match.toLowerCase();
          if (!SPAM.some(s => e.includes(s)) && e.length < 60) {
            report.email = e;
            break;
          }
        }
      }
    } catch {}
  }

  // ── Quality scoring ───────────────────────────────────────────────────────
  let score = 100;

  if (!finalUrl.startsWith('https://')) {
    score -= 10;
    report.issues.push('No HTTPS — insecure connection');
  }
  report.score_breakdown.https = finalUrl.startsWith('https://');

  const title = $('title').text().trim();
  if (!title || title.length < 5) {
    score -= 15;
    report.issues.push('Missing or empty page title (bad SEO)');
  } else if (title.length > 70) {
    score -= 5;
    report.issues.push('Page title too long (>70 chars)');
  }
  report.score_breakdown.title = !!title;

  const metaDesc = $('meta[name="description"]').attr('content');
  if (!metaDesc) {
    score -= 10;
    report.issues.push('No meta description — hurts search ranking');
  }
  report.score_breakdown.metaDescription = !!metaDesc;

  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    score -= 20;
    report.issues.push('Not mobile-friendly — no viewport meta tag');
  }
  report.score_breakdown.mobile = !!viewport;

  const h1Count = $('h1').length;
  if (h1Count === 0) {
    score -= 10;
    report.issues.push('No H1 heading — confuses search engines');
  } else if (h1Count > 1) {
    score -= 5;
    report.issues.push('Multiple H1 tags — bad SEO structure');
  }
  report.score_breakdown.h1 = h1Count === 1;

  const bodyText = $('body').text().toLowerCase();
  const ctaPatterns = ['contact us', 'call us', 'book now', 'order now', 'get started',
    'free quote', 'request a quote', 'buy now', 'sign up', 'schedule', 'get in touch'];
  const hasCTA = ctaPatterns.some(kw => bodyText.includes(kw));
  if (!hasCTA) {
    score -= 15;
    report.issues.push('No clear call-to-action found (no booking/contact prompt)');
  }
  report.score_breakdown.cta = hasCTA;

  const imgsTotal = $('img').length;
  const imgsNoAlt = $('img:not([alt])').length + $('img[alt=""]').length;
  if (imgsTotal > 0 && imgsNoAlt / imgsTotal > 0.5) {
    score -= 5;
    report.issues.push(`${imgsNoAlt}/${imgsTotal} images missing alt text`);
  }

  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{10,}/.test(bodyText);
  if (!hasPhone) {
    score -= 5;
    report.issues.push('No phone number visible on page');
  }

  try {
    const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000);
    const psRes = await fetch(psUrl, { signal: controller.signal });
    clearTimeout(tid);

    if (psRes.ok) {
      const psData = await psRes.json();
      const perf = psData.lighthouseResult?.categories?.performance?.score;
      if (perf !== undefined) {
        const perfScore = Math.round(perf * 100);
        report.score_breakdown.pageSpeed = perfScore;
        if (perfScore < 30) {
          score -= 20;
          report.issues.push(`Very slow website (PageSpeed: ${perfScore}/100)`);
        } else if (perfScore < 50) {
          score -= 12;
          report.issues.push(`Slow website (PageSpeed: ${perfScore}/100)`);
        } else if (perfScore < 70) {
          score -= 5;
          report.issues.push(`Could be faster (PageSpeed: ${perfScore}/100)`);
        }
      }
    }
  } catch {}

  report.score = Math.max(Math.min(score, 100), 0);
  report.summary = buildSummary(report.score, report.issues);

  return report;
}

function buildSummary(score, issues) {
  if (score >= 80) return 'Website is in good shape with minor areas to improve.';
  if (score >= 55) {
    const top = issues.slice(0, 2).join('; ').toLowerCase();
    return `Website has notable weaknesses — ${top}. A targeted update could significantly improve conversions.`;
  }
  const top = issues.slice(0, 3).join('; ').toLowerCase();
  return `Website is poor quality with critical issues: ${top}. A full redesign would dramatically improve results.`;
}
