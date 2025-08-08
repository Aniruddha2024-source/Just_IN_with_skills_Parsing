import cron from 'node-cron';
import { sendJobRecommendationsToAllUsers } from './jobMatchingService.js';

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

  console.log('Scheduled tasks initialized');
};