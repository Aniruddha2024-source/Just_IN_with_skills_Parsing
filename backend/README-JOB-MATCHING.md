# Job Matching and Email Notification Feature

## Overview

This feature automatically matches users with jobs based on their skills and sends email notifications in the following scenarios:

1. When a user updates their skills in their profile
2. When a new job is posted that matches a user's skills
3. Daily job recommendations for all users (via cron job)

## Setup Instructions

### 1. Install Dependencies

The feature requires the following npm packages:

- `nodemailer` - For sending emails
- `node-cron` - For scheduling daily job matching

These dependencies have been added to the package.json. Run the following command to install them:

```bash
npm install
```

### 2. Configure Email Settings

Create a `.env` file in the root directory of the backend (if not already present) and add the following email configuration:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Note for Gmail users:**
- You need to use an App Password instead of your regular password
- Go to your Google Account > Security > 2-Step Verification > App passwords
- Create a new app password for 'Mail' and use it here

### 3. Restart the Server

Restart your Node.js server to apply the changes:

```bash
npm run dev
```

## How It Works

### Data Structure

- `User.profile.skills`: Array of strings representing user skills
- `Job.requirements`: Array of strings representing job requirements
- `User.email`: Used for sending notifications

### Matching Logic

The matching algorithm works as follows:

1. Normalizes skills and requirements (converts to lowercase, trims whitespace)
2. Finds matching skills between user skills and job requirements
3. Calculates a match score as a percentage (number of matching skills / total job requirements)
4. Filters jobs/users that meet a minimum match threshold (default: 30%)

### Notification Triggers

1. **User Updates Skills**:
   - When a user updates their profile with new skills, the system immediately finds matching jobs and sends an email

2. **New Job Posted**:
   - When a recruiter posts a new job, the system finds users with matching skills and sends them notifications

3. **Daily Job Matching**:
   - A cron job runs daily at 9:00 AM to match all users with suitable jobs and send recommendations

## Files Added/Modified

1. **New Files**:
   - `services/jobMatchingService.js` - Core matching logic and email sending functions
   - `services/schedulerService.js` - Cron job setup for daily matching
   - `utils/emailService.js` - Email sending utilities

2. **Modified Files**:
   - `controllers/user.controller.js` - Updated to trigger matching when skills are updated
   - `controllers/job.controller.js` - Updated to trigger notifications when a job is posted
   - `index.js` - Updated to initialize scheduled tasks

## Customization

### Email Templates

You can customize the email templates in `utils/emailService.js`:

- `sendJobRecommendationEmail` - Template for job recommendations
- `sendNewJobNotificationEmail` - Template for new job notifications

### Matching Threshold

You can adjust the minimum match percentage in `services/jobMatchingService.js`:

- Default is 30% (0.3) - Change the `minMatchPercentage` parameter in the relevant functions

### Scheduling

You can modify the schedule for daily job matching in `services/schedulerService.js`:

- Default is daily at 9:00 AM (`0 9 * * *`)
- Modify the cron expression to change the schedule