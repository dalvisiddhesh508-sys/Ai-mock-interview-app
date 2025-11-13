const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profession: { type: String, required: true },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  totalQuestions: { type: Number, default: 9 },
  currentRound: { type: Number, default: 1 },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);

