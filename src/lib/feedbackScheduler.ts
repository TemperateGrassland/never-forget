import { log } from "@/lib/logger";

export interface FeedbackConfig {
  template: string;
  audience: 'all' | 'subscribers';
  customData: {
    context: string;
    anonymous: string;
  };
}

export interface FeedbackStatus {
  shouldSend: boolean;
  template: string | null;
  templateCount: number;
  templateIndex: number | null;
  daysUntilRepeat: number;
  cycleNumber: number;
}

export class FeedbackScheduler {
  
  /**
   * Check if today should send feedback based on interval
   */
  static shouldSendFeedbackToday(): boolean {
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const intervalDays = parseInt(process.env.FEEDBACK_INTERVAL_DAYS || '3');
    
    return daysSinceEpoch % intervalDays === 0;
  }
  
  /**
   * Get current template to use based on cycle calculation
   */
  static getCurrentFeedbackTemplate(): string {
    const templates = this.getTemplateList();
    const templateIndex = this.calculateTemplateIndex();
    
    return templates[templateIndex % templates.length];
  }
  
  /**
   * Get complete feedback configuration for current cycle
   */
  static getFeedbackConfig(): FeedbackConfig {
    return {
      template: this.getCurrentFeedbackTemplate(),
      audience: 'all',
      customData: {
        context: 'your experience with Never Forget',
        anonymous: 'true'
      }
    };
  }
  
  /**
   * Main method for cron jobs - logs details and returns status
   */
  static checkFeedbackSchedule(jobId: string, jobName: string): FeedbackStatus {
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const intervalDays = parseInt(process.env.FEEDBACK_INTERVAL_DAYS || '3');
    const cycleNumber = Math.floor(daysSinceEpoch / intervalDays);
    const templates = this.getTemplateList();
    const templateIndex = cycleNumber % templates.length;
    const shouldSend = daysSinceEpoch % intervalDays === 0;
    const daysUntilRepeat = templates.length * intervalDays;
    
    // Detailed logging
    log.info('📊 Feedback scheduler check', {
      jobId,
      jobName,
      date: today.toISOString().split('T')[0],
      calculation: {
        daysSinceEpoch,
        intervalDays,
        modulo: daysSinceEpoch % intervalDays,
        cycleNumber,
        shouldSend
      },
      templates: {
        total: templates.length,
        availableList: templates,
        selectedIndex: shouldSend ? templateIndex : null,
        selectedTemplate: shouldSend ? templates[templateIndex] : null,
        daysUntilRepeat
      },
      scheduling: {
        lastFeedbackCycle: cycleNumber - 1,
        nextFeedbackCycle: cycleNumber + 1,
        cyclesToCompleteRotation: templates.length
      }
    });
    
    return {
      shouldSend,
      template: shouldSend ? templates[templateIndex] : null,
      templateCount: templates.length,
      templateIndex: shouldSend ? templateIndex : null,
      daysUntilRepeat,
      cycleNumber
    };
  }
  
  /**
   * Parse templates from environment variable with validation
   */
  private static getTemplateList(): string[] {
    const templatesEnv = process.env.FEEDBACK_TEMPLATES || 'feedback_request';
    const templates = templatesEnv
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    // Ensure we always have at least one template
    if (templates.length === 0) {
      log.warn('⚠️ No valid feedback templates found in FEEDBACK_TEMPLATES, using default');
      return ['feedback_request'];
    }
    
    return templates;
  }
  
  /**
   * Calculate which template index to use based on current date
   */
  private static calculateTemplateIndex(): number {
    const today = new Date();
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    const intervalDays = parseInt(process.env.FEEDBACK_INTERVAL_DAYS || '3');
    
    // How many feedback cycles have occurred since epoch
    return Math.floor(daysSinceEpoch / intervalDays);
  }
  
  /**
   * Get upcoming feedback schedule for planning/debugging
   */
  static getUpcomingSchedule(daysAhead: number = 30): Array<{
    date: string;
    template: string;
    index: number;
    cycleNumber: number;
  }> {
    const templates = this.getTemplateList();
    const intervalDays = parseInt(process.env.FEEDBACK_INTERVAL_DAYS || '3');
    const today = new Date();
    const schedule: Array<{
      date: string;
      template: string;
      index: number;
      cycleNumber: number;
    }> = [];
    
    for (let i = 0; i < daysAhead; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const daysSinceEpoch = Math.floor(futureDate.getTime() / (1000 * 60 * 60 * 24));
      const isFeedbackDay = daysSinceEpoch % intervalDays === 0;
      
      if (isFeedbackDay) {
        const cycleNumber = Math.floor(daysSinceEpoch / intervalDays);
        const templateIndex = cycleNumber % templates.length;
        
        schedule.push({
          date: futureDate.toISOString().split('T')[0],
          template: templates[templateIndex],
          index: templateIndex,
          cycleNumber
        });
      }
    }
    
    return schedule;
  }
  
  /**
   * Get rotation information for analytics
   */
  static getRotationInfo() {
    const templates = this.getTemplateList();
    const intervalDays = parseInt(process.env.FEEDBACK_INTERVAL_DAYS || '3');
    
    return {
      templateCount: templates.length,
      intervalDays,
      fullCycleDays: templates.length * intervalDays,
      fullCycleWeeks: Math.round((templates.length * intervalDays) / 7),
      templatesPerMonth: Math.round(30 / intervalDays),
      availableTemplates: templates
    };
  }
}