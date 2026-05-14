import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeUrl: { type: String },
  resumeOriginalName: { type: String },
  extractor: { type: String, default: 'rule-v1' },
  predicted: [{ type: String }],
  confirmed: [{ type: String }],
  resumeText: { type: String },
  metrics: {
    TP: Number,
    FP: Number,
    FN: Number,
    precision: Number,
    recall: Number,
    f1: Number,
    jaccard: Number
  }
}, { timestamps: true });

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
