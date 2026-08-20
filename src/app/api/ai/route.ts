import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { model, prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    // Gather live context from database
    const [trades, marketData, tms] = await Promise.all([
      prisma.portfolio.findMany({ orderBy: { date: 'desc' }, take: 25 }),
      prisma.marketCache.findMany({ orderBy: { volume: 'desc' }, take: 25 }),
      prisma.tmsTransaction.findMany({ orderBy: { date: 'desc' }, take: 15 }),
    ]);

    const context = `You are an expert quantitative financial analyst for the Nepal Stock Exchange (NEPSE).
Here is the user's live terminal context:

PORTFOLIO RECENT TRADES (${trades.length}):
${trades.map(t => `${t.transactionType} ${t.qty} ${t.symbol} @ Rs ${t.price} on ${t.date.toISOString().split('T')[0]}`).join('\n')}

MARKET WATCH ACTIVE HIGHLIGHTS (${marketData.length}):
${marketData.map(m => `${m.symbol}: LTP Rs ${m.ltp} (${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(2)}%) Vol: ${m.volume}`).join('\n')}

TMS RECENT CASH FLOWS:
${tms.map(t => `${t.type} via ${t.medium}: Rs ${t.amount} (${t.status})`).join('\n')}

USER QUERY:
${prompt}

Please provide clear, actionable quantitative insight tailored specifically to NEPSE trading rules, WACC, and broker fees. Use Nepalese Rupees (Rs).`;

    let aiResponse = '';

    if (model === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          response: '💡 Gemini API key not configured in .env. To enable Google Gemini 2.0 Flash analysis, add GEMINI_API_KEY to your .env file.\n\nLocal Quantitative Analysis: Based on your portfolio, ensure positions exceeding 25% allocation are monitored against strict stop-loss levels.'
        });
      }
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] }),
      });
      const data = await res.json();
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    } else if (model === 'gpt') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          response: '💡 OpenAI API key not configured in .env. Add OPENAI_API_KEY to .env to use GPT-4o.'
        });
      }
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: context }], max_tokens: 2000 }),
      });
      const data = await res.json();
      aiResponse = data.choices?.[0]?.message?.content || 'No response from GPT.';
    } else if (model === 'grok') {
      const apiKey = process.env.GROK_API_KEY;
      if (!apiKey) {
        return NextResponse.json({
          success: true,
          response: '💡 Grok API key not configured in .env. Add GROK_API_KEY to .env to use Grok.'
        });
      }
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'grok-beta', messages: [{ role: 'user', content: context }], max_tokens: 2000 }),
      });
      const data = await res.json();
      aiResponse = data.choices?.[0]?.message?.content || 'No response from Grok.';
    } else {
      aiResponse = 'Please select a valid AI model (Gemini, GPT-4o, or Grok).';
    }

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error) {
    const authErr = handleAuthError(error);
    if (authErr) return authErr;
    console.error('AI route error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
