# Pomodoro Timer App

A mobile Pomodoro Technique timer app built with Flutter frontend and Node.js/Express backend.

## Features

- **Frontend (Flutter)**:
  - 25-minute work sessions with 5-minute short breaks and 15-minute long breaks
  - Visual timer with play/pause/reset functionality
  - Session counter
  - Clean, intuitive UI

- **Backend (Node.js/Express)**:
  - REST API for session management
  - Local file storage for session data
  - Session statistics and analytics
  - CORS enabled for Flutter app communication

## Project Structure

```
├── pemodoro_timer/          # Flutter app
│   ├── lib/
│   │   └── main.dart       # Main Flutter app code
│   ├── pubspec.yaml        # Flutter dependencies
│   └── ...
├── backend/                # Node.js backend
│   ├── server.js          # Express server
│   ├── package.json       # Node.js dependencies
│   └── data/              # Session data storage (auto-created)
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   Or for development (with auto-restart):
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the Flutter app directory:
   ```bash
   cd pemodoro_timer
   ```

2. Get Flutter dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## API Endpoints

- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/today` - Get today's sessions
- `GET /api/sessions/stats` - Get session statistics
- `POST /api/sessions` - Create a new session
- `DELETE /api/sessions/:id` - Delete a session
- `GET /health` - Health check

## Usage

1. Start the backend server first
2. Run the Flutter app on your device/emulator
3. Use the timer for 25-minute work sessions
4. Sessions are automatically saved to the backend
5. Check the backend logs or use the API endpoints to view session data

## Data Storage

Session data is stored locally in `backend/data/sessions.json`. Each session includes:
- Unique ID
- Start and end time
- Duration (in minutes)
- Session type (pomodoro/break)
- Creation timestamp

## Customization

You can modify the timer durations in `lib/main.dart`:
```dart
static const int pomodoroMinutes = 25;
static const int shortBreakMinutes = 5;
static const int longBreakMinutes = 15;
```

## Troubleshooting

- Make sure the backend is running before using the Flutter app
- Check that the backend URL in Flutter matches your server (`http://localhost:3000`)
- For Android emulator, you might need to use `http://10.0.2.2:3000` instead of `localhost`
- For iOS simulator, use `http://localhost:3000`
