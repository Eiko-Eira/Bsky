import { BskyAgent } from '@atproto/api';

interface BotConfig {
  id: string;
  handle: string;
  appPassword: string;
  keywords: string[];
  repost: boolean;
  like: boolean;
}

export class BotInstance {
  public config: BotConfig;
  private agent: BskyAgent;
  private timer: NodeJS.Timeout | null = null;
  private processedUris: Set<string> = new Set(); // Prevent double-liking/reposting
  private dailyActiveMs: number = 0;
  private lastResetDay: number = new Date().getDate();
  private pauseUntil: number = 0; // Backoff timestamp
  private activityLogs: { time: number; msg: string }[] = [];

  constructor(config: BotConfig) {
    this.config = config;
    this.agent = new BskyAgent({ service: 'https://bsky.social' });
  }

  public getLogs() {
    return this.activityLogs;
  }

  private addLog(msg: string) {
    this.activityLogs.unshift({ time: Date.now(), msg });
    if (this.activityLogs.length > 50) this.activityLogs.pop();
  }

  public async start() {
    this.addLog(`Starting initialization for ${this.config.handle}...`);
    console.log(`[BOT ${this.config.handle}] Starting initialization...`);
    try {
      await this.agent.login({
        identifier: this.config.handle,
        password: this.config.appPassword,
      });
      this.addLog("Logged in successfully.");
      console.log(`[BOT ${this.config.handle}] Logged in successfully.`);
      
      // Run immediately on start
      this.runCycle();
      
      // Schedule to run every 6 minutes
      // 6 minutes = 6 * 60 * 1000 = 360000 ms
      this.timer = setInterval(() => this.runCycle(), 360000);
      
    } catch (error: any) {
      console.error(`[BOT ${this.config.handle}] Login failed:`, error.message);
      throw error;
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.addLog("Bot stopped via Dashboard.");
    console.log(`[BOT ${this.config.handle}] Stopped.`);
  }

  private async runCycle() {
    // BACKOFF LOGIC
    if (Date.now() < this.pauseUntil) {
      console.log(`[BOT ${this.config.handle}] ⏳ Backoff active. Skipping cycle until threshold clears.`);
      return;
    }

    // 10-HOUR DAILY LIMIT LOGIC
    const currentDay = new Date().getDate();
    if (currentDay !== this.lastResetDay) {
      this.dailyActiveMs = 0;
      this.lastResetDay = currentDay;
    }

    const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;
    if (this.dailyActiveMs >= TEN_HOURS_IN_MS) {
      this.addLog("10-hour daily limit hit. Sleeping until midnight.");
      console.log(`[BOT ${this.config.handle}] 10-hour daily limit hit. Sleeping until midnight.`);
      return;
    }

    console.log(`[BOT ${this.config.handle}] Starting 6-minute cycle...`);
    
    let cycleLogs = 0;
    for (const keyword of this.config.keywords) {
      try {
        // Search for recent posts matching the keyword
        const res = await this.agent.app.bsky.feed.searchPosts({
          q: keyword,
          limit: 10,
        });

        const posts = res.data.posts;
        console.log(`[BOT ${this.config.handle}] Found ${posts.length} posts for keyword: ${keyword}`);

        for (const post of posts) {
          // Skip if we already acted on it
          if (this.processedUris.has(post.uri)) continue;

          // Only proceed if it's a valid target (e.g., skip replies if we want to be safe)
          
          if (this.config.like) {
            try {
              await this.agent.like(post.uri, post.cid);
              this.addLog(`Liked post by ${post.author.handle} (Keyword: ${keyword})`);
              cycleLogs++;
              console.log(`[BOT ${this.config.handle}] Liked post by ${post.author.handle}`);
            } catch (e: any) {
              // Ignore already liked errors
              if (!e.message.includes('already')) console.error(`[BOT ${this.config.handle}] Like error:`, e.message);
            }
          }

          if (this.config.repost) {
            try {
              await this.agent.repost(post.uri, post.cid);
              this.addLog(`Reposted post by ${post.author.handle} (Keyword: ${keyword})`);
              cycleLogs++;
              console.log(`[BOT ${this.config.handle}] Reposted post by ${post.author.handle}`);
            } catch (e: any) {
              if (!e.message.includes('already')) console.error(`[BOT ${this.config.handle}] Repost error:`, e.message);
            }
          }

          // Mark as processed
          this.processedUris.add(post.uri);
          
          // Memory leak prevention: cap set at 2000 items
          if (this.processedUris.size > 2000) {
            const iter = this.processedUris.values();
            this.processedUris.delete(iter.next().value);
          }
          
          // Small delay to prevent rate limiting (1 second)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.error(`[BOT ${this.config.handle}] Error searching for ${keyword}:`, error.message);
        
        // 1-HOUR BACKOFF ON RATE LIMITS
        if (error.status === 429 || (error.message && error.message.toLowerCase().includes('rate limit'))) {
          this.addLog(`🛑 API RATE LIMIT HIT. Initiating strict 1-hour backoff.`);
          console.log(`[BOT ${this.config.handle}] 🛑 API RATE LIMIT HIT. Initiating strict 1-hour backoff.`);
          this.pauseUntil = Date.now() + (60 * 60 * 1000); // Wait exactly 1 hour
        }
      }
    }
    
    // Increment our daily usage counter by the 6 minute interval approximation
    this.dailyActiveMs += 360000;
    if (cycleLogs > 0) {
      this.addLog(`Cycle complete. ${cycleLogs} actions taken. Sleeping for 6 minutes.`);
    }
    console.log(`[BOT ${this.config.handle}] Cycle complete. Sleeping for 6 minutes.`);
  }
}

// In-memory manager for active bots (Next step: sync this with Firestore)
class BotManager {
  private activeBots: Map<string, BotInstance> = new Map();

  public async deployBot(config: BotConfig) {
    if (this.activeBots.has(config.id)) {
      this.stopBot(config.id); // Re-deploy replaces existing
    }

    const bot = new BotInstance(config);
    await bot.start(); // Will throw if login fails
    
    this.activeBots.set(config.id, bot);
    return true;
  }

  public stopBot(id: string) {
    if (this.activeBots.has(id)) {
      this.activeBots.get(id)!.stop();
      this.activeBots.delete(id);
      return true;
    }
    return false;
  }

  public async updateBot(id: string, updates: Partial<BotConfig>) {
    const existing = this.activeBots.get(id);
    if (!existing) return false;

    const newConfig = { ...existing.config, ...updates };
    this.stopBot(id);
    await this.deployBot(newConfig);
    return true;
  }

  public getLogs(id: string) {
    const bot = this.activeBots.get(id);
    if (!bot) return [];
    return bot.getLogs();
  }

  public getActiveBots() {
    return Array.from(this.activeBots.keys());
  }
}

export const botManager = new BotManager();
