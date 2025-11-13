const mongoose = require('mongoose');

const finalReportSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
  summary: { type: String, required: true },
  top_strengths: [String],
  improvement_areas: [String],
  roadmap: [String],
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FinalReport', finalReportSchema);

