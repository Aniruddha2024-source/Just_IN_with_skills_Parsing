import cron from 'node-cron';
import { sendJobRecommendationsToAllUsers } from './jobMatchingService.js';
import JobRecommendationService from './jobRecommendationService.js';

/**
 * Initialize all scheduled tasks
 */
export const initScheduledTasks = () => {
  // Schedule daily job matching at 9:00 AM
  // Cron format: second(optional) minute hour day-of-month month day-of-week
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily job matching task...');
    try {
      const result = await sendJobRecommendationsToAllUsers();
      console.log('Daily job matching completed:', result);
    } catch (error) {
      console.error('Error in daily job matching task:', error);
    }
  });

  // Schedule SBERT-based job recommendations at 10:00 AM daily
  cron.schedule('0 10 * * *', async () => {
    console.log('🤖 Running SBERT-based job recommendations...');
    try {
      const result = await JobRecommendationService.runDailyRecommendations();
      console.log('✅ SBERT recommendations completed:', {
        emailsSent: result.emailsSent,
        totalProcessed: result.totalUsersProcessed,
        successRate: result.successRate
      });
    } catch (error) {
      console.error('❌ Error in SBERT recommendations:', error);
    }
  });

  console.log('Scheduled tasks initialized');
};