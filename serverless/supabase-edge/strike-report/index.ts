// @supabase-auth-allow: none
// @ts-nocheck
// Supabase Edge Function: strike-report
// Deploy with: supabase functions deploy strike-report
// Invoke with: supabase functions invoke strike-report --no-verify-jwt
// Scheduled via pg_cron: call http_post to edge function URL
// Environment variables configured in supabase dashboard (Project Settings -> Functions)

// Deno Edge Function runtime server import
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

// Helper: ISO week key
function isoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Convert ISO week string (YYYY-W##) to last day (Sunday) of that week
 * @param {string} weekStr - e.g., "2025-W42"
 * @returns {Date}
 */
function weekToLastDay(weekStr) {
  const [yearStr, wStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  // Find Monday of week 1 (week containing Jan 4)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  // Monday of target week
  const weekMonday = new Date(week1Monday);
  weekMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  // Sunday (last day) is Monday + 6 days
  const weekSunday = new Date(weekMonday);
  weekSunday.setUTCDate(weekMonday.getUTCDate() + 6);
  return weekSunday;
}

/**
 * Format header: DD-MMM (HH AM/PM)
 * @param {Date} now
 * @param {string} tz
 */
function formatHeader(now, tz) {
  const day = String(now.getDate()).padStart(2, '0');
  const monthShort = now.toLocaleString('en-US', { month: 'short', timeZone: tz });
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, '0');
  return `${day}-${monthShort} (${hourStr} ${ampm})`;
}

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
  const REPORT_TIMEZONE = Deno.env.get('REPORT_TIMEZONE') || 'UTC';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 });
  }

  // Use service key only server-side within Edge Function
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: users, error: userErr } = await supabase.from('users').select('user_id, user_name');
  if (userErr) return new Response(JSON.stringify({ error: userErr.message }), { status: 500 });

  // Fetch ALL incomplete goals (cumulative across all dates/weeks)
  const { data: dailyRows, error: dailyErr } = await supabase
    .from('daily_goal_tracker')
    .select('user_id, goal, comments, date')
    .eq('completed', false);
  if (dailyErr) return new Response(JSON.stringify({ error: dailyErr.message }), { status: 500 });

  const { data: weeklyRows, error: weeklyErr } = await supabase
    .from('weekly_goal_tracker')
    .select('user_id, goal, comments, week')
    .eq('completed', false);
  if (weeklyErr) return new Response(JSON.stringify({ error: weeklyErr.message }), { status: 500 });

  /** @type {Record<string, Array<{ goal: string; comments: string; date: string }>>} */
  const dailyMap = {};
  dailyRows?.forEach((r) => {
    (dailyMap[r.user_id] ||= []).push({ goal: r.goal, comments: r.comments || '', date: r.date });
  });
  /** @type {Record<string, Array<{ goal: string; comments: string; week: string }>>} */
  const weeklyMap = {};
  weeklyRows?.forEach((r) => {
    (weeklyMap[r.user_id] ||= []).push({ goal: r.goal, comments: r.comments || '', week: r.week });
  });

  /**
   * Pick last incomplete item by actual date (weekly items use last day of week).
   * @param {Array<{goal:string,comments:string,date:string}>} dArr
   * @param {Array<{goal:string,comments:string,week:string}>} wArr
   */
  function pickLast(dArr = [], wArr = []) {
    // Convert daily items to {date, goal, comments}
    const dailyWithDate = dArr.map((d) => ({
      sortDate: new Date(d.date),
      goal: d.goal,
      comments: d.comments,
    }));
    // Convert weekly items to {date (last day of week), goal, comments}
    const weeklyWithDate = wArr.map((w) => ({
      sortDate: weekToLastDay(w.week),
      goal: w.goal,
      comments: w.comments,
    }));
    const combined = [...dailyWithDate, ...weeklyWithDate];
    if (!combined.length) return null;
    // Sort by date descending (most recent first)
    combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    const last = combined[0];
    return last.comments?.trim() ? last.comments.trim() : last.goal;
  }

  const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: REPORT_TIMEZONE }));
  const header = formatHeader(tzNow, REPORT_TIMEZONE);

  /** @type {Record<string,string>} */
  const nameMap = {};
  users?.forEach((u) => {
    nameMap[u.user_id] = u.user_name || u.user_id;
  });

  const lines =
    users?.map((u) => {
      const d = dailyMap[u.user_id] || [];
      const w = weeklyMap[u.user_id] || [];
      const total = d.length + w.length;
      const lastInfo = pickLast(d, w);
      return {
        user_id: u.user_id,
        name: nameMap[u.user_id],
        total,
        bracket: lastInfo ? ` [${lastInfo}]` : '',
      };
    }) || [];
  // Sort alphabetically by user name
  lines.sort((a, b) => a.name.localeCompare(b.name));
  const body = lines.map((l) => `${l.name}: ${l.total}${l.bracket}`).join('\n');
  const message = `${header}\n${body}`;

  // Send to Telegram only
  const tgResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
  });
  let tgJson = null;
  if (tgResp.ok) {
    tgJson = await tgResp.json();
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message,
      telegramMessageId: tgJson?.message_id,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
