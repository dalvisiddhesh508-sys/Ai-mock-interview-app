// API Configuration
const API_BASE = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let currentSession = null;
let currentRound = 1;
let previousQuestions = [];
let recognition = null;
let isListening = false;

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('answer').value = transcript;
            stopListening();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopListening();
            showError('Voice input error. Please try again.');
        };

        recognition.onend = () => {
            stopListening();
        };
    } else {
        document.getElementById('voiceInputBtn').disabled = true;
        document.getElementById('voiceInputBtn').title = 'Speech recognition not supported';
    }
}

// Voice Input Functions
function startListening() {
    if (!recognition) {
        showError('Speech recognition not available');
        return;
    }
    
    if (isListening) {
        stopListening();
        return;
    }

    try {
        recognition.start();
        isListening = true;
        const btn = document.getElementById('voiceInputBtn');
        btn.classList.add('active');
        document.getElementById('voiceStatus').textContent = 'Listening...';
    } catch (error) {
        console.error('Error starting recognition:', error);
        showError('Could not start voice input');
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
        const btn = document.getElementById('voiceInputBtn');
        btn.classList.remove('active');
        document.getElementById('voiceStatus').textContent = 'Start Voice Input';
    }
}

// Voice Output Functions
function speak(text) {
    if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to use Windows voice
        const voices = window.speechSynthesis.getVoices();
        const windowsVoice = voices.find(v => 
            v.name.includes('Microsoft') || 
            v.name.includes('Zira') || 
            v.name.includes('Mark')
        );
        if (windowsVoice) {
            utterance.voice = windowsVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Error Handling
function showError(message, elementId = 'authError') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    } else {
        alert(message);
    }
}

// API Calls
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Authentication
async function login(email, password) {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showScreen('setupScreen');
    } catch (error) {
        showError(error.message);
    }
}

async function register(userData) {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showScreen('setupScreen');
    } catch (error) {
        showError(error.message);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    currentSession = null;
    currentRound = 1;
    previousQuestions = [];
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showScreen('authScreen');
}

// Interview Functions
async function startInterview(profession, experienceLevel) {
    try {
        const data = await apiCall('/interview/start', {
            method: 'POST',
            body: JSON.stringify({ profession, experienceLevel }),
        });

        currentSession = data.sessionId;
        currentRound = 1;
        previousQuestions = [];
        
        if (currentUser) {
            document.getElementById('userName').textContent = currentUser.name;
        }
        
        updateProgress();
        await loadQuestion();
        showScreen('interviewScreen');
    } catch (error) {
        showError(error.message);
    }
}

async function loadQuestion() {
    try {
        document.getElementById('questionText').textContent = 'Loading question...';
        document.getElementById('answer').value = '';
        document.getElementById('feedbackSection').classList.add('hidden');
        document.getElementById('submitAnswerBtn').classList.remove('hidden');
        document.getElementById('nextQuestionBtn').classList.add('hidden');
        document.getElementById('finishInterviewBtn').classList.add('hidden');

        const data = await apiCall('/interview/question', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: currentSession,
                roundNumber: currentRound,
                previousQuestions: previousQuestions,
                profession: currentUser?.profession || 'Software Engineer',
                experienceLevel: currentUser?.experienceLevel || 'mid',
            }),
        });

        document.getElementById('questionText').textContent = data.question;
        document.getElementById('focusArea').textContent = `Focus: ${data.focus_area || 'General'}`;
        
        // Speak the question
        speak(data.question);
        
        previousQuestions.push(data.question);
    } catch (error) {
        showError(error.message);
    }
}

async function submitAnswer() {
    const answer = document.getElementById('answer').value.trim();
    if (!answer) {
        showError('Please provide an answer');
        return;
    }

    try {
        document.getElementById('submitAnswerBtn').disabled = true;
        document.getElementById('submitAnswerBtn').textContent = 'Evaluating...';

        const questionText = document.getElementById('questionText').textContent;
        const data = await apiCall('/interview/answer', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: currentSession,
                question: questionText,
                answer: answer,
                profession: currentUser?.profession || 'Software Engineer',
                experienceLevel: currentUser?.experienceLevel || 'mid',
                roundNumber: currentRound,
            }),
        });

        displayFeedback(data);
        document.getElementById('submitAnswerBtn').classList.add('hidden');
        
        if (currentRound < 9) {
            document.getElementById('nextQuestionBtn').classList.remove('hidden');
        } else {
            document.getElementById('finishInterviewBtn').classList.remove('hidden');
        }
    } catch (error) {
        showError(error.message);
        document.getElementById('submitAnswerBtn').disabled = false;
        document.getElementById('submitAnswerBtn').textContent = 'Submit Answer';
    }
}

function displayFeedback(feedback) {
    document.getElementById('scoreValue').textContent = feedback.score || 0;
    
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = '';
    (feedback.strengths || []).forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
    });

    const improvementsList = document.getElementById('improvementsList');
    improvementsList.innerHTML = '';
    (feedback.improvements || []).forEach(improvement => {
        const li = document.createElement('li');
        li.textContent = improvement;
        improvementsList.appendChild(li);
    });

    document.getElementById('nextTip').textContent = feedback.next_tip || 'Keep up the good work!';
    
    document.getElementById('feedbackSection').classList.remove('hidden');
    
    // Speak feedback summary
    const feedbackText = `Your score is ${feedback.score}. ${feedback.next_tip || ''}`;
    speak(feedbackText);
}

async function nextQuestion() {
    currentRound++;
    updateProgress();
    await loadQuestion();
}

function updateProgress() {
    const progress = (currentRound / 9) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `Question ${currentRound} of 9`;
}

async function finishInterview() {
    try {
        document.getElementById('finishInterviewBtn').disabled = true;
        document.getElementById('finishInterviewBtn').textContent = 'Generating Report...';

        const data = await apiCall('/interview/summary', {
            method: 'POST',
            body: JSON.stringify({
                sessionId: currentSession,
                profession: currentUser?.profession || 'Software Engineer',
            }),
        });

        displayReport(data);
        showScreen('reportScreen');
    } catch (error) {
        showError(error.message);
        document.getElementById('finishInterviewBtn').disabled = false;
        document.getElementById('finishInterviewBtn').textContent = 'Finish Interview';
    }
}

function displayReport(report) {
    document.getElementById('reportSummary').textContent = report.summary || 'Interview completed successfully.';
    
    const strengthsList = document.getElementById('reportStrengths');
    strengthsList.innerHTML = '';
    (report.top_strengths || []).forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
    });

    const improvementsList = document.getElementById('reportImprovements');
    improvementsList.innerHTML = '';
    (report.improvement_areas || []).forEach(area => {
        const li = document.createElement('li');
        li.textContent = area;
        improvementsList.appendChild(li);
    });

    const roadmapList = document.getElementById('reportRoadmap');
    roadmapList.innerHTML = '';
    (report.roadmap || []).forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = item;
        roadmapList.appendChild(li);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();

    // Auth Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tab}Form`).classList.add('active');
        });
    });

    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });

    // Register Form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            profession: document.getElementById('registerProfession').value,
            experienceLevel: document.getElementById('registerExperience').value,
        };
        await register(userData);
    });

    // Setup Form
    document.getElementById('setupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const profession = document.getElementById('profession').value;
        const experienceLevel = document.getElementById('experienceLevel').value;
        await startInterview(profession, experienceLevel);
    });

    // Interview Actions
    document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    document.getElementById('finishInterviewBtn').addEventListener('click', finishInterview);

    // Voice Controls
    document.getElementById('voiceInputBtn').addEventListener('click', startListening);
    document.getElementById('speakQuestionBtn').addEventListener('click', () => {
        const question = document.getElementById('questionText').textContent;
        if (question && question !== 'Loading question...') {
            speak(question);
        }
    });

    // Logout Buttons
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('logoutBtn2').addEventListener('click', logout);
    document.getElementById('logoutBtn3').addEventListener('click', logout);

    // New Interview Button
    document.getElementById('newInterviewBtn').addEventListener('click', () => {
        showScreen('setupScreen');
    });

    // Check if user is already logged in
    if (authToken && currentUser) {
        showScreen('setupScreen');
    } else {
        showScreen('authScreen');
    }
});

