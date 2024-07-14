# Simple Quiz Application

This is a simple quiz application built with Node.js, Express, and vanilla JavaScript. 
The application allows users to select and take various quizzes, view their scores and track the completion status.

## Project Structure

The back-end server side is located in the root folder. The "public" folder contains Web UI files.
The "quizzes" folder is used for keeping actual quizzes in JSON format.

## Setup Instructions

### Prerequisites

- Node.js (v12.x or higher)
- npm (v6.x or higher)

### Installation

1. **Clone this repository**
 ```bash
   git clone https://github.com/yourusername/quiz-app.git
   cd quiz-app
 ```
2. **Install dependencies**
 ```bash

npm install express fs path
 ```
3. **Running the Project**
 ```bash
npm start
 ```
This will start the Express server on port 3000 (The port number is hardcoded).

4. **Open the application in your browser**

Navigate to http://localhost:3000 in your web browser to access the quiz application.

5. **API Endpoints**
* GET /quiz-titles: Fetches the list of quiz titles.
* GET /quizzes/:id: Fetches the quiz data for a specific quiz ID.
* GET /check-quiz/:id: Checks if a quiz has been completed in the current session.
* POST /submit-quiz/:id: Submits the quiz answers and stores the score.

6. **Adding New Quizzes**
To add a new quiz, create a new JSON file in the quizzes folder following the structure below:
```json
{
  "title": "Quiz Title",
  "questions": [
    {
      "id": 1,
      "prompt": "Question prompt?",
      "options": [
        {
          "value": "A",
          "text": "Option A"
        },
        {
          "value": "B",
          "text": "Option B"
        },
        {
          "value": "C",
          "text": "Option C"
        },
        {
          "value": "D",
          "text": "Option D"
        }
      ],
      "correctAnswer": "A",
      "explanation": "Explanation for the correct answer."
    }
    ...
  ]
}
 ```
***Note***
The only single choice question format is supported.
