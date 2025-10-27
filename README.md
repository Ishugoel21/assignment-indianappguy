A full-stack application that integrates with Gmail to fetch emails and classify them using OpenAI GPT-4o into categories such as Important, Promotions, Social, Marketing, Spam, and General.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Features

- Gmail OAuth integration for secure email access
- Real-time email fetching from user's Gmail account
- AI-powered email classification using OpenAI GPT-4o
- Email preview with full content display
- Responsive UI with modern design
- Category-based email organization
- Session management for secure authentication

## Tech Stack

### Backend
- Node.js with Express.js
- Google OAuth 2.0 for Gmail integration
- OpenAI API for email classification
- Express Session with file-based storage
- Passport.js for authentication

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- Custom UI components
- Lucide React for icons

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- A Google Cloud Project with Gmail API enabled
- An OpenAI API key

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Assignment-Indianappguy"
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

## Configuration

### Backend Configuration

1. Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
SERVER_ROOT_URL=http://localhost:4000
CLIENT_ROOT_URL=http://localhost:3000

# Session Secret (change this to a random secure string)
SESSION_SECRET=your-super-secret-session-key-change-me

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Gmail API for your project
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Set authorized redirect URIs: `http://localhost:4000/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### Frontend Configuration

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Running the Application

### Start the Backend Server

From the root directory:

```bash
npm start
```

The backend server will start on `http://localhost:4000`

### Start the Frontend

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

# API Endpoints

### Authentication

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/status` - Check authentication status
- `GET /auth/logout` - Logout user
- `GET /auth/success` - OAuth success redirect
- `GET /auth/failure` - OAuth failure redirect

### Email Operations

- `GET /api/emails/fetch?limit=N` - Fetch emails from Gmail
- `GET /api/emails/content/:emailId` - Get full email content
- `POST /api/emails/classify` - Classify emails using AI

### Example Request

```bash
curl -X POST http://localhost:4000/api/emails/classify \
  -H "Content-Type: application/json" \
  -d '{
    "openaiKey": "your-openai-key",
    "limit": 15
  }'
```

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Enter your OpenAI API key and save it
4. Click "Login with Google" to authenticate
5. Grant necessary permissions for Gmail access
6. Once redirected, you'll see your emails
7. Configure the number of emails to fetch (5-100)
8. Click "Refresh" to fetch latest emails
9. Click "Classify with AI" to categorize emails
10. Click on any email to preview its full content

## Environment Variables

### Backend

- `PORT` - Backend server port (default: 4000)
- `SERVER_ROOT_URL` - Backend server URL
- `CLIENT_ROOT_URL` - Frontend server URL
- `SESSION_SECRET` - Session encryption secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - OAuth callback URL
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - OpenAI model to use (default: gpt-4o)

### Frontend

- `NEXT_PUBLIC_API_URL` - Backend API URL

## Troubleshooting

### Common Issues

1. **OAuth errors**
   - Verify Google OAuth credentials in `.env`
   - Ensure callback URL matches Google Cloud Console settings
   - Check that Gmail API is enabled in your Google Cloud project

2. **OpenAI API errors**
   - Verify your OpenAI API key is valid
   - Check if you have sufficient API credits
   - Ensure the model name is correct (gpt-4o, gpt-4-turbo, or gpt-3.5-turbo)

3. **Session issues**
   - Clear the `sessions/` directory
   - Restart the backend server
   - Check SESSION_SECRET is set in `.env`

4. **CORS errors**
   - Verify CLIENT_ROOT_URL in `.env` matches your frontend URL
   - Check that credentials: 'include' is used in fetch requests

5. **Email fetching fails**
   - Ensure user is authenticated with Google
   - Check that Gmail API permissions are granted
   - Verify tokens are stored correctly

### Development Tips

- Use `nodemon` for automatic server restart during development
- Check browser console and server logs for detailed error messages
- Ensure both frontend and backend are running simultaneously
- Clear browser localStorage if encountering authentication issues

## Security Notes

- Never commit your `.env` files to version control
- Use strong, random values for SESSION_SECRET
- Regularly rotate API keys
- Implement rate limiting for production use
- Use HTTPS in production environments

## License

This project is for educational purposes.

## Support

For issues or questions, please open an issue in the repository.

