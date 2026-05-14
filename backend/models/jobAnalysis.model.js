import mongoose from 'mongoose';

/**
 * JobAnalysis Schema
 * Stores extracted skills and entity information from job descriptions
 * Uses Spacy NLP for intelligent skill extraction
 */
const jobAnalysisSchema = new mongoose.Schema({
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true,
    unique: true 
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  extractedSkills: [{ 
    type: String 
  }],
  extractorUsed: { 
    type: String, 
    default: 'spacy-nlp',
    enum: ['spacy-nlp', 'rule-based']
  },
  confidence: { 
    type: Number, 
    min: 0, 
    max: 1,
    default: 0.95
  },
  skillCount: { 
    type: Number,
    default: 0
  },
  entities: {
    TECHNOLOGY: [String],
    FRAMEWORK: [String],
    DATABASE: [String],
    CLOUD: [String],
    DEVOPS: [String],
    LANGUAGE: [String],
    TOOL: [String],
    METHODOLOGY: [String]
  },
  jobDescription: { 
    type: String 
  },
  requirementsList: [{ 
    type: String 
  }],
  softSkillsRequired: [{ 
    type: String 
  }],
  experienceYearsRequired: {
    type: Number
  },
  jobTitle: {
    type: String
  },
  location: {
    type: String
  },
  matchingResumes: [{
    userId: mongoose.Schema.Types.ObjectId,
    matchPercentage: Number,
    matchedSkills: [String],
    missingSkills: [String]
  }],
  lastAnalyzedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster lookups
jobAnalysisSchema.index({ company: 1 });
jobAnalysisSchema.index({ extractedSkills: 1 });

export const JobAnalysis = mongoose.model('JobAnalysis', jobAnalysisSchema);
