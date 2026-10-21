// unknown_venue_collector.ts - Oshigoto Map
// Threshold: 20 unique (for first 2 months) OR 14 days - whichever first
// Quicker turnaround as requested

export const CONFIG = {
  THRESHOLD_UNIQUE: 20, // Phase 1: 20, Phase 2: change to 50
  REPORT_INTERVAL_DAYS: 14,
  PHASE: "phase1-quick-turnaround"
};

export type UnknownVenueEntry = {
  name: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  examples: string[];
  suspectedRegion?: string;
}

export type UnknownVenueLog = Record<string, UnknownVenueEntry>;

export class UnknownVenueCollector {
  private log: UnknownVenueLog = {};
  private lastReportDate: string;

  constructor(initialLog: UnknownVenueLog = {}, lastReportDate?: string) {
    this.log = initialLog;
    this.lastReportDate = lastReportDate || new Date().toISOString();
  }

  track(venueName: string, postUrl?: string, suspectedRegion?: string) {
    const now = new Date().toISOString();
    const key = venueName.trim().toLowerCase();
    
    if (!this.log[key]) {
      this.log[key] = {
        name: venueName.trim(),
        count: 1,
        firstSeen: now,
        lastSeen: now,
        examples: postUrl ? [postUrl] : [],
        suspectedRegion,
      };
    } else {
      this.log[key].count += 1;
      this.log[key].lastSeen = now;
      if (postUrl && this.log[key].examples.length < 3 && !this.log[key].examples.includes(postUrl)) {
        this.log[key].examples.push(postUrl);
      }
    }

    console.log(`[UNKNOWN_VENUE] ${venueName} (${this.log[key].count}x) - ${Object.keys(this.log).length}/${CONFIG.THRESHOLD_UNIQUE}`);

    if (this.shouldReport()) {
      return this.generateReport();
    }
    return null;
  }

  shouldReport(): boolean {
    const uniqueCount = Object.keys(this.log).length;
    if (uniqueCount >= CONFIG.THRESHOLD_UNIQUE) return true;
    
    const daysSince = (Date.now() - new Date(this.lastReportDate).getTime()) / (1000*60*60*24);
    return daysSince >= CONFIG.REPORT_INTERVAL_DAYS;
  }

  generateReport() {
    const sorted = Object.values(this.log).sort((a,b) => b.count - a.count);
    return {
      generatedAt: new Date().toISOString(),
      uniqueCount: sorted.length,
      threshold: CONFIG.THRESHOLD_UNIQUE,
      phase: CONFIG.PHASE,
      topCandidates: sorted.slice(0, 20),
      all: sorted,
      nextAction: "Review topCandidates -> approve to add to venues_whitelist.json"
    }
  }

  getStats() {
    const daysSince = Math.floor((Date.now() - new Date(this.lastReportDate).getTime()) / (1000*60*60*24));
    return {
      uniqueCount: Object.keys(this.log).length,
      threshold: CONFIG.THRESHOLD_UNIQUE,
      daysSinceLastReport: daysSince,
      nextReportInDays: CONFIG.REPORT_INTERVAL_DAYS - daysSince,
      willTriggerAt: CONFIG.THRESHOLD_UNIQUE,
    }
  }
}

// --- REPORT DELIVERY ---
// Option 1: Current MVP - Replit logs (you need to login to Replit to see)
// console.log only - that's what you have now

// Option 2: In-app admin API - RECOMMENDED for mobile
// Create src/app/api/unknown-venues/route.ts:
/*
export async function GET() {
  const log = await readUnknownLog(); // from src/data/unknown_venues_log.json
  const collector = new UnknownVenueCollector(log);
  return Response.json({ stats: collector.getStats(), report: collector.generateReport() });
}
// Then check anytime at: https://your-app.replit.app/api/unknown-venues
// No Replit login needed - works on your phone browser
*/

// Option 3: Email - requires RESEND_API_KEY in Replit Secrets
/*
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'oshigoto-map@yourapp.com',
  to: 'masato@example.com', // your registered email
  subject: `Oshigoto Map: ${stats.uniqueCount} new venues to review`,
  html: `<pre>${JSON.stringify(report.topCandidates, null, 2)}</pre>`
});
*/

// Option 4: Mobile push - if you wrap app with OneSignal
/*
await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: { Authorization: `Basic ${process.env.ONESIGNAL_KEY}` },
  body: JSON.stringify({
    app_id: process.env.ONESIGNAL_APP_ID,
    contents: { en: `${stats.uniqueCount} new venues to review` },
    included_segments: ["Subscribed Users"]
  })
});
*/
