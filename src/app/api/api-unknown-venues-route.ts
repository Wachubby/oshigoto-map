// src/app/api/unknown-venues/route.ts - Drop this into your Replit project
// Gives you report WITHOUT needing to login to Replit - just open on mobile

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// For MVP: read from file, or use in-memory if no file yet
async function getUnknownLog() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/unknown_venues_log.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('No existing log, starting fresh');
  }
  return {};
}

export async function GET() {
  const log = await getUnknownLog();
  const uniqueCount = Object.keys(log).length;
  const sorted = Object.values(log as any).sort((a:any,b:any) => b.count - a.count);
  
  return NextResponse.json({
    stats: {
      uniqueCount,
      threshold: 20,
      reportInterval: '14 days or 20 unique',
      nextReportIn: `${20 - uniqueCount} more venues until report`,
      phase: 'phase1-quick-turnaround - first 1-2 months',
    },
    topCandidates: (sorted as any[]).slice(0, 20),
    all: sorted,
    how_to_check: {
      option1_replit_logs: 'Login to Replit -> Logs tab -> search [UNKNOWN_VENUE]',
      option2_this_api: 'You are here! Bookmark https://YOUR_APP.replit.app/api/unknown-venues - check anytime on mobile, no login',
      option3_email: 'Add RESEND_API_KEY to Replit Secrets to get email',
      option4_admin_page: 'Create /admin/venues page that calls this API',
    }
  });
}
