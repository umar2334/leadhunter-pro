import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateOutreach(lead) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Free tier: 15 requests/min, 1M tokens/day
  });

  const websiteContext = lead.website
    ? `Their website (${lead.website}) scored ${lead.analysis_score ?? '?'}/100. Issues found: ${
        Array.isArray(lead.analysis_issues) ? lead.analysis_issues.join(', ') : 'none listed'
      }. Summary: ${lead.analysis_summary || 'weak website'}.`
    : 'They have NO website at all — a massive missed opportunity for their business.';

  const prompt = `
You are an expert web development sales consultant who writes high-converting outreach messages.

Business details:
- Name: ${lead.name}
- Category: ${lead.category || 'local business'}
- Location: ${lead.address || 'local area'}
- Phone: ${lead.phone || 'not listed'}
- Website situation: ${websiteContext}

Write 3 outreach messages in this exact JSON format (no markdown, no code block, raw JSON only):
{
  "email": {
    "subject": "...",
    "body": "..."
  },
  "whatsapp": "...",
  "call_script": "..."
}

Rules:
- Email subject: curiosity-driven, mention business name, under 55 chars
- Email body: 4-5 sentences. Mention their specific weakness or no-website situation. Offer a solution. End with a soft CTA. Professional but warm tone. NO generic fluff.
- WhatsApp: 2-3 sentences. Casual, friendly, conversational. Start with "Hi [Name]". Mention one specific thing.
- Call script: 5-6 sentences. Natural opener, state who you are, give one value point, ask to continue. Sounds like a real human.
- Your name is [Your Name], your company is a web development agency.
- Never mention competitors. Never sound automated or spammy.
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response (Gemini sometimes wraps in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini error:', err.message);
    return buildFallbackOutreach(lead);
  }
}

function buildFallbackOutreach(lead) {
  const name = lead.name || 'there';
  const hasWebsite = !!lead.website;

  return {
    email: {
      subject: `Quick idea for ${name}`,
      body: hasWebsite
        ? `Hi,\n\nI was researching ${lead.category || 'local businesses'} in your area and came across ${name}. I ran a quick audit of your website and noticed several areas that could be improved — including mobile responsiveness and missing calls-to-action.\n\nThese improvements typically lead to more calls and bookings from your existing traffic.\n\nI specialize in fast, modern websites for businesses like yours. Would you be open to a 10-minute call to discuss?\n\nBest,\n[Your Name]`
        : `Hi,\n\nI found ${name} while searching for ${lead.category || 'local businesses'} in ${lead.address || 'your area'} and noticed you don't have a website yet.\n\nIn 2025, having no website means losing customers to competitors daily — most people check online before visiting anywhere.\n\nI build professional websites for local businesses starting at just $299. I'd love to show you what one could look like for your business.\n\nWould you have 10 minutes this week?\n\nBest,\n[Your Name]`,
    },
    whatsapp: hasWebsite
      ? `Hi ${name.split(' ')[0]}! I checked out your website and noticed a few quick improvements that could get you more customers. Do you have 5 mins to chat? 🙂`
      : `Hi! I noticed ${name} doesn't have a website yet. I help local businesses get online quickly and affordably. Mind if I show you a quick concept? 🙂`,
    call_script: `Hi, is this ${name}? Great — my name is [Your Name], I'm a web developer who works with local businesses in your area. I came across your business and had a quick idea that I think could help you get more customers online. It'll only take two minutes — is now an okay time to chat?`,
  };
}
