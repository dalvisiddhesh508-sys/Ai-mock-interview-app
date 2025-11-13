const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { callGemini } = require('../services/geminiService');
const InterviewSession = require('../models/InterviewSession');
const QuestionResponse = require('../models/QuestionResponse');
const FinalReport = require('../models/FinalReport');

router.post('/start', auth, async (req, res) => {
  try {
    const session = await InterviewSession.create({
      userId: req.user.id,
      profession: req.body.profession || 'Software Engineer',
    });
    res.json({ sessionId: session._id, profession: session.profession });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start session', error: err.message });
  }
});

router.post('/question', auth, async (req, res) => {
  try {
    const { sessionId, roundNumber, previousQuestions, profession, experienceLevel } = req.body;
    
    const prompt = `
      Generate a new interview question for a ${experienceLevel || 'mid'}-level ${profession} candidate.
      This is question ${roundNumber} of 9.
      ${previousQuestions && previousQuestions.length > 0 ? `Avoid these questions: ${previousQuestions.join(', ')}.` : ''}
      Return ONLY valid JSON in this exact format (no markdown, no code blocks):
      {"question": "Your question here", "focus_area": "Technical Skills/Problem Solving/Communication/etc"}
    `;

    const result = await callGemini(prompt);
    let parsed;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
    } catch (e) {
      // Fallback if JSON parsing fails
      parsed = {
        question: result.replace(/```json|```/g, '').trim(),
        focus_area: 'General'
      };
    }
    
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate question', error: err.message });
  }
});

router.post('/answer', auth, async (req, res) => {
  try {
    const { sessionId, question, answer, profession, experienceLevel } = req.body;
    
    const evalPrompt = `
You are a STRICT interview evaluator. Evaluate this answer with high standards and realistic scoring.

Question: "${question}"
Answer: "${answer}"
Profession: ${profession}
Experience Level: ${experienceLevel || 'mid'}

EVALUATION CRITERIA (Be Strict):
- Score 0-100 based on: relevance, depth, clarity, structure, and specificity
- Deduct points for: vague answers, lack of examples, poor structure, irrelevant content, grammatical issues
- Do NOT give high scores (80+) unless answer is excellent and well-articulated
- ${experienceLevel === 'senior' ? 'For senior level: expect strategic thinking and deep technical knowledge' : ''}
- ${experienceLevel === 'junior' ? 'For junior level: expect foundational knowledge and willingness to learn' : ''}

DO NOT do the following:
- Do NOT be overly generous with scoring
- Do NOT praise vague or incomplete answers
- Do NOT ignore lack of structure or clarity
- Do NOT give credit for answers that don't directly address the question
- Do NOT overlook grammatical or communication issues

STRENGTHS: Identify ONLY 2-3 real, specific strengths (not generic praise)
IMPROVEMENTS: Identify MUST-HAVE 2-3 improvements (critical areas to work on)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "score": 65,
  "strengths": ["specific strength with detail"],
  "improvements": ["specific improvement that must be addressed"],
  "next_tip": "Concrete actionable advice"
}
    `;

    const result = await callGemini(evalPrompt);
    let feedback;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      feedback = JSON.parse(jsonMatch ? jsonMatch[0] : result);
      
      // Ensure score is reasonable (not inflated)
      if (feedback.score > 95) {
        feedback.score = 95; // Cap at 95 for perfection
      }
      if (feedback.score < 0) {
        feedback.score = 0;
      }
    } catch (e) {
      feedback = {
        score: 60,
        strengths: ['Attempted to answer the question'],
        improvements: ['Provide more specific examples', 'Structure your response better', 'Address all parts of the question'],
        next_tip: 'Take time to think through your answer before responding'
      };
    }

    await QuestionResponse.create({
      sessionId,
      questionText: question,
      userAnswer: answer,
      aiFeedback: feedback,
      roundNumber: req.body.roundNumber || 1,
    });

    // Update session current round
    await InterviewSession.findByIdAndUpdate(sessionId, {
      $inc: { currentRound: 1 }
    });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Failed to evaluate answer', error: err.message });
  }
});

router.post('/summary', auth, async (req, res) => {
  try {
    const { sessionId, profession } = req.body;
    const responses = await QuestionResponse.find({ sessionId });
    
    if (responses.length === 0) {
      return res.status(400).json({ message: 'No responses found for this session' });
    }

    const feedbackJson = JSON.stringify(responses.map(r => ({
      question: r.questionText,
      answer: r.userAnswer,
      feedback: r.aiFeedback
    })));

    const averageScore = responses.reduce((sum, r) => sum + (r.aiFeedback?.score || 0), 0) / responses.length;
    const overallPerformanceLevel = 
      averageScore >= 85 ? 'Excellent' :
      averageScore >= 75 ? 'Good' :
      averageScore >= 65 ? 'Average' :
      averageScore >= 50 ? 'Below Average' :
      'Poor';

    const summaryPrompt = `
You are creating a comprehensive, HONEST interview summary. Be realistic and constructive.

Candidate Profile: ${profession} (Average Score: ${averageScore.toFixed(1)}/100, Performance: ${overallPerformanceLevel})

Interview Data: ${feedbackJson}

CREATE A REALISTIC ASSESSMENT - NOT OVERLY POSITIVE:
- If average score is low (below 70), be honest about significant gaps
- Top strengths should be DEMONSTRATED in their answers, not assumed
- Improvement areas should be specific to their actual performance
- Roadmap should be realistic and actionable for their level

ROADMAP: Create 5 specific, measurable 30-day action items based on their actual weaknesses
- Focus on the biggest gaps identified
- Make items time-bound and actionable
- Prioritize by importance

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "Honest 3-4 sentence assessment of overall performance with specific observations",
  "top_strengths": ["demonstrated strength 1", "demonstrated strength 2", "demonstrated strength 3"],
  "improvement_areas": ["critical area 1", "critical area 2", "critical area 3"],
  "roadmap": ["Week 1-2: specific action", "Week 2-3: specific action", "Week 3-4: specific action", "Week 4: specific action", "Ongoing: specific action"]
}
    `;

    const result = await callGemini(summaryPrompt);
    let report;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch ? jsonMatch[0] : result);
    } catch (e) {
      report = {
        summary: `Interview completed with an average score of ${averageScore.toFixed(1)}/100. Review feedback for specific areas to improve.`,
        top_strengths: ['Completed the full interview'],
        improvement_areas: ['Provide more detailed examples', 'Improve response structure', 'Demonstrate deeper technical knowledge'],
        roadmap: [
          'Week 1: Review common interview questions in your domain',
          'Week 2: Practice formulating structured responses with examples',
          'Week 3: Study technical concepts specific to your role',
          'Week 4: Do mock interviews and measure improvement',
          'Ongoing: Record and review your answers for clarity and depth'
        ]
      };
    }

    const savedReport = await FinalReport.create({
      sessionId,
      ...report,
    });

    // Mark session as completed
    await InterviewSession.findByIdAndUpdate(sessionId, {
      status: 'completed',
      completedAt: new Date(),
    });

    res.json(savedReport);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
});

module.exports = router;

