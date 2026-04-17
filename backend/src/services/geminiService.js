import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateOutreach(lead) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const websiteContext = lead.website
    ? `They have a website (${lead.website}) that scored ${lead.analysis_score ?? '?'}/100. Specific issues found: ${
        Array.isArray(lead.analysis_issues) && lead.analysis_issues.length
          ? lead.analysis_issues.join('; ')
          : 'general quality issues'
      }. Analysis: ${lead.analysis_summary || 'website needs improvement'}.`
    : `They have ZERO online presence — no website whatsoever. Every day they lose customers to competitors who do have websites.`;

  const prompt = `
You are the founder of a premium web design agency. You write outreach personally — not as a salesperson, but as a founder who genuinely spotted a problem and wants to help. Your tone is confident, direct, and human. You never sound like a template.

Lead details:
- Business: ${lead.name}
- Type: ${lead.category || 'local business'}
- Location: ${lead.address || 'Dubai, UAE'}
- Phone: ${lead.phone || 'not listed'}
- Email: ${lead.email || 'not listed'}
- Website situation: ${websiteContext}

Write 3 personalized outreach messages. Return ONLY raw JSON, no markdown, no code block:

{
  "email": {
    "subject": "...",
    "body": "..."
  },
  "whatsapp": "...",
  "call_script": "..."
}

STRICT RULES FOR EACH:

EMAIL SUBJECT (max 52 chars):
- Be specific to this business — mention a real problem you spotted
- Create curiosity without being clickbait
- Examples: "I found 3 things costing ${lead.name} customers", "Why your competitors are ranking above you"

EMAIL BODY:
- Open with ONE specific observation about their exact situation (no website OR a specific issue you found)
- 2nd paragraph: what this is costing them in real terms (missed calls, lost bookings, customers going to competitors)
- 3rd paragraph: introduce yourself as the founder — you built X websites, you specialize in their industry or region
- 4th paragraph: a specific offer — not generic. E.g. "I'll build you a full site in 7 days" or "I can fix the 3 mobile issues I spotted in under a week"
- Close: soft CTA — ask for a 15-minute call, no pressure. Sign as "Umar | Founder, [Agency Name]"
- Tone: confident founder, not a salesperson. No fluff. No "I hope this email finds you well". Get straight to the point.
- Length: 5-7 sentences max

WHATSAPP:
- Max 3 sentences. Voice of a real person texting, not a broadcast message.
- Start with: "Hi [first word of business name or owner title],"
- Mention ONE very specific thing you noticed
- End with a casual question to open conversation
- No emojis spam — max 1 relevant emoji
- Example style: "Hi, I noticed ${lead.name} doesn't have a website — I checked. I build sites for businesses like yours in 7 days flat. Worth a quick call? 📲"

CALL SCRIPT:
- Written as a natural spoken script — short sentences, real pauses
- Opening: "Hi, is this [Name]?" → introduce yourself as Umar, founder of your agency
- Hook: one sentence on WHY you're calling them specifically (reference their no-website or the exact issue)
- Value: one concrete result you've delivered for a similar business
- Ask: simple close — "Would you have 10 minutes this week to look at what I have in mind for you?"
- Tone: calm, confident, founder-to-founder — not a cold call robot
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini error:', err.message);
    return buildFallbackOutreach(lead);
  }
}

function buildFallbackOutreach(lead) {
  const bizName = lead.name || 'there';
  const firstName = bizName.split(' ')[0];
  const category = lead.category || 'local business';
  const location = lead.address ? lead.address.split(',')[0] : 'your area';
  const hasWebsite = !!lead.website;
  const score = lead.analysis_score;
  const issues = Array.isArray(lead.analysis_issues) ? lead.analysis_issues : [];

  if (!hasWebsite) {
    return {
      email: {
        subject: `${bizName} has no website — here's what it's costing you`,
        body: `Hi,

I was searching for ${category} in ${location} and came across ${bizName}. I noticed you don't have a website — which means every time someone searches for what you offer, they're finding your competitors instead of you.

In 2025, 81% of customers check online before visiting a business. Without a website, you're invisible to most of them. That's real revenue walking out the door every day.

I'm Umar, founder of a web design agency. I've built websites for over 50 local businesses across the UAE, and I can have yours live in 7 days — mobile-first, fast, and built to convert visitors into calls.

I'd love to show you a quick concept for ${bizName}. Would you have 15 minutes this week for a call?

Umar | Founder, LeadHunter Agency`,
      },
      whatsapp: `Hi ${firstName}, I noticed ${bizName} doesn't have a website yet — I searched and couldn't find you online. I build professional sites for businesses like yours in 7 days flat. Worth a quick chat? 📲`,
      call_script: `Hi, is this ${bizName}? Great — my name is Umar, I'm the founder of a web design agency based here in the UAE.

I'm calling because I was searching for ${category} in ${location} and couldn't find a website for ${bizName}. That means you're missing customers who are searching for exactly what you offer right now.

I recently built a website for a similar ${category} business and they started getting 3–4 new enquiries a week within the first month.

I'd love to show you what I have in mind for your business — would you have 10 minutes this week to take a look?`,
    };
  }

  const topIssue = issues[0] || 'several areas that could be improved';
  const scoreText = score !== null ? `scored ${score}/100` : 'has some issues';

  return {
    email: {
      subject: `I audited ${bizName}'s website — found ${issues.length || 'a few'} issues`,
      body: `Hi,

I ran a quick audit on ${bizName}'s website and it ${scoreText}. The biggest issue I spotted: ${topIssue}.

This kind of problem directly costs you customers — people land on your site and leave before contacting you. Most businesses don't realize how much revenue a slow or broken website is leaking.

I'm Umar, founder of a web design agency. I specialize in fixing exactly these issues for ${category} businesses in the UAE — faster load times, better mobile experience, and clear calls-to-action that turn visitors into enquiries.

I can fix the issues I found in under a week. Would you have 15 minutes to jump on a quick call so I can walk you through what I'd do?

Umar | Founder, LeadHunter Agency`,
    },
    whatsapp: `Hi ${firstName}, I took a look at ${bizName}'s website and spotted a couple of things that are likely costing you customers — including ${topIssue.toLowerCase()}. I can fix it fast. Worth a quick call? 📲`,
    call_script: `Hi, is this ${bizName}? Great — I'm Umar, I run a web design agency here in the UAE.

I'm reaching out because I ran a quick audit on your website and it flagged ${issues.length || 'a few'} issues — the main one being ${topIssue.toLowerCase()}.

Issues like this directly affect how many people actually contact you after visiting your site. I recently helped a similar ${category} business fix the same problems and they saw a 40% increase in enquiries within a month.

I have a specific plan for what I'd change on your site. Would you have 10 minutes this week to hear it?`,
  };
}
