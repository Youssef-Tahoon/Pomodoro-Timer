import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pomodoro Timer',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
        useMaterial3: true,
      ),
      home: const PomodoroTimer(title: 'Pomodoro Timer'),
    );
  }
}

class PomodoroTimer extends StatefulWidget {
  const PomodoroTimer({super.key, required this.title});

  final String title;

  @override
  State<PomodoroTimer> createState() => _PomodoroTimerState();
}

class _PomodoroTimerState extends State<PomodoroTimer> {
  static const int pomodoroMinutes = 25;
  static const int shortBreakMinutes = 5;
  static const int longBreakMinutes = 15;
  
  int _timeLeftInSeconds = pomodoroMinutes * 60;
  bool _isRunning = false;
  bool _isPomodoro = true; // true for work, false for break
  Timer? _timer;
  int _completedPomodoros = 0;
  DateTime? _sessionStartTime;

  // Backend URL - update this to match your backend server
  static const String backendUrl = 'http://localhost:3000';

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    if (!_isRunning) {
      _sessionStartTime = DateTime.now();
      setState(() {
        _isRunning = true;
      });
      
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          if (_timeLeftInSeconds > 0) {
            _timeLeftInSeconds--;
          } else {
            _completeSession();
          }
        });
      });
    }
  }

  void _pauseTimer() {
    setState(() {
      _isRunning = false;
    });
    _timer?.cancel();
  }

  void _resetTimer() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _timeLeftInSeconds = _isPomodoro ? pomodoroMinutes * 60 : 
                          (_completedPomodoros % 4 == 3 ? longBreakMinutes * 60 : shortBreakMinutes * 60);
    });
  }

  void _completeSession() async {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
    });

    if (_isPomodoro) {
      // Completed a work session
      _completedPomodoros++;
      await _saveSessionToBackend();
      
      // Switch to break
      setState(() {
        _isPomodoro = false;
        _timeLeftInSeconds = _completedPomodoros % 4 == 0 ? 
                            longBreakMinutes * 60 : shortBreakMinutes * 60;
      });
    } else {
      // Completed a break
      setState(() {
        _isPomodoro = true;
        _timeLeftInSeconds = pomodoroMinutes * 60;
      });
    }
  }

  Future<void> _saveSessionToBackend() async {
    if (_sessionStartTime != null) {
      try {
        final response = await http.post(
          Uri.parse('$backendUrl/api/sessions'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'startTime': _sessionStartTime!.toIso8601String(),
            'endTime': DateTime.now().toIso8601String(),
            'duration': pomodoroMinutes,
            'type': 'pomodoro'
          }),
        );
        
        if (response.statusCode == 201) {
          print('Session saved successfully');
        } else {
          print('Failed to save session: ${response.statusCode}');
        }
      } catch (e) {
        print('Error saving session: $e');
      }
    }
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              _isPomodoro ? 'Work Time' : 
              (_completedPomodoros % 4 == 0 ? 'Long Break' : 'Short Break'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 20),
            Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: _isPomodoro ? Colors.red : Colors.green,
                  width: 4,
                ),
              ),
              child: Center(
                child: Text(
                  _formatTime(_timeLeftInSeconds),
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: _isPomodoro ? Colors.red : Colors.green,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _isRunning ? _pauseTimer : _startTimer,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  ),
                  child: Text(
                    _isRunning ? 'Pause' : 'Start',
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
                ElevatedButton(
                  onPressed: _resetTimer,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  ),
                  child: const Text(
                    'Reset',
                    style: TextStyle(fontSize: 18),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Completed Pomodoros: $_completedPomodoros',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      ),
    );
  }
}
