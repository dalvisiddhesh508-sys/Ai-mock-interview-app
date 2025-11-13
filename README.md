# 🎤 AI Mock Interview Application

An AI-driven mock interview web platform that simulates realistic role-based interviews using DeepSeek (via OpenRouter), provides voice & text interaction, gives real-time feedback, and stores data in MongoDB.

## 🧩 Features

- **AI-Powered Interviews**: 9 adaptive questions via DeepSeek (OpenRouter API)
- **Real-time Feedback**: AI evaluation with strengths, improvements, and tips
- **Voice Interaction**: Speech-to-text input and text-to-speech output
- **Progress Tracking**: Visual progress bar for 9-round interviews
- **Final Report**: AI-generated summary with 30-day roadmap
- **Secure Authentication**: JWT + bcrypt password hashing
- **Database**: MongoDB for session, question, and report storage

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- OpenRouter API key (free tier available)

### Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/interviewDB
   JWT_SECRET=yourSuperSecretKey
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Get your OpenRouter API Key**
   - Visit [OpenRouter](https://openrouter.ai)
   - Sign up for a free account
   - Generate an API key
   - Add it to your `.env` file (or update hardcoded value in `services/geminiService.js`)

5. **Set up MongoDB**
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string
   - Replace the `MONGO_URI` in your `.env` file (or update hardcoded value in `config/db.js`)

6. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Register a new account or login
   - Start your first interview!

## 📁 Project Structure

```
mock-interview-app/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # Environment variables (create this)
├── .env.example             # Example environment file
├── config/
│   └── db.js                # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── InterviewSession.js  # Interview session model
│   ├── QuestionResponse.js  # Question/answer model
│   └── FinalReport.js       # Final report model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── interviewRoutes.js   # Interview routes
├── middleware/
│   └── authMiddleware.js    # JWT authentication middleware
├── services/
│   └── geminiService.js     # Google Gemini API service
├── utils/
│   └── generateToken.js     # JWT token generator
└── public/
    ├── index.html           # Frontend HTML
    ├── style.css            # Styling
    └── main.js              # Frontend JavaScript
```

## 🎯 Usage

### User Flow

1. **Register/Login**: Create an account or login with existing credentials
2. **Setup Interview**: Select your profession and experience level
3. **Answer Questions**: 
   - Type your answers or use voice input (click the microphone button)
   - Click "Speak Question" to hear the question read aloud
   - Submit your answer to get AI feedback
4. **Review Feedback**: See your score, strengths, and areas for improvement
5. **Complete Interview**: Finish all 9 questions to get your final report
6. **View Report**: Get a comprehensive summary with a 30-day improvement roadmap

### Voice Features

- **Voice Input**: Click the microphone button to speak your answer
- **Voice Output**: Click "Speak Question" to hear questions read aloud
- **Browser Support**: Works best in Chrome/Edge (Web Speech API support)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **AI**: Google Gemini 1.5 Flash API
- **Voice**: Web Speech API (Speech Recognition & Synthesis)
- **Real-time**: Socket.io

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Interview
- `POST /interview/start` - Start new interview session
- `POST /interview/question` - Get next question
- `POST /interview/answer` - Submit answer and get feedback
- `POST /interview/summary` - Get final interview report

All interview endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## 🐳 Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ai-mock-interview .
docker run -p 3000:3000 --env-file .env ai-mock-interview
```

## 🚢 Deployment

### Render.com
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy!

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Set environment variables in Vercel dashboard

### AWS/Azure
- Use services like AWS Elastic Beanstalk or Azure App Service
- Ensure MongoDB Atlas allows connections from your server IP

## 🔒 Security Notes

- Never commit your `.env` file
- Use strong JWT secrets in production
- Enable MongoDB Atlas IP whitelisting
- Use HTTPS in production
- Validate and sanitize all user inputs

## 📄 License

ISC

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📧 Support

For issues or questions, please open an issue on the repository.

---

**Built with ❤️ using Google Gemini AI**

