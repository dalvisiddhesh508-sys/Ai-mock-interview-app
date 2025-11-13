const mongoose = require('mongoose');

const questionResponseSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  questionText: { type: String, required: true },
  userAnswer: { type: String, required: true },
  aiFeedback: {
    score: Number,
    strengths: [String],
    improvements: [String],
    next_tip: String,
  },
  roundNumber: { type: Number, required: true },
  answeredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('QuestionResponse', questionResponseSchema);

