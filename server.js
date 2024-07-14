/**
 * Quiz App. Back-end server.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Static files come from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// JSON parsing for HTTP request bodies
app.use(express.json());

// Initialization of completed quiz storage. It has IDs and their scores per session
const completedQuizzes = new Map();

/**
 * Reads quiz titles from the file systems ("quizzes" directory)
 * @param callback
 */
function readTitles(callback) {
    let quizTitles = {};
    const quizzesPath = path.join(__dirname, 'quizzes');
    // Reading all quiz files in the 'quizzes' folder
    fs.readdir(quizzesPath, (err, files) => {
        if (err) {
            console.error('Error reading quiz files:', err);
            res.status(500).json({error: 'Internal server error'});
            return;
        }

        // Files must be filtered out non-JSON files (if any)
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        // Reading contents of each JSON file to get quiz titles and IDs
        quizTitles = jsonFiles.map((file, index) => {
            const filePath = path.join(quizzesPath, file);
            const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Assigning unique ID based on index
            return {id: index + 1, title: quizData.title};
        });
        callback(quizTitles);
    });
}

let glQuizTitles = {};
readTitles(quizTitles => {
    // Send the array of quiz titles as JSON response
    console.log(quizTitles);
    glQuizTitles = quizTitles;
});

// Endpoint to fetch quiz titles from the 'quizzes' folder
app.get('/quiz-titles', (req, res) => {
    res.json(glQuizTitles);
});

// Define endpoint to fetch quiz data by ID
app.get('/quizzes/:id', (req, res) => {
    const {id} = req.params;

    try {
        const quizFilePath = path.join(__dirname, 'quizzes', `quiz${id}.json`);
        const quizData = fs.readFileSync(quizFilePath, 'utf8'); // Specify encoding option
        const quiz = JSON.parse(quizData);

        res.json(quiz);
    } catch (error) {
        console.error(`Error fetching quiz ${id}:`, error);
        res.status(404).json({error: 'Quiz not found'});
    }
});

// Endpoint for fetching quiz data by its ID
app.get('/total', (req, res) => {
    try {
        let sum = 0.0;
        for (const value of completedQuizzes.values()) {
            sum += value;
        }
        res.json({total: sum / glQuizTitles.length});
    } catch (error) {
        console.error(`Cannot read total:`, error);
        res.status(404).json({error: 'Cannot read total'});
    }
});

// Endpoint to check if quiz has been completed
app.get('/check-quiz/:id', (req, res) => {
    const {id} = req.params;

    const completed = completedQuizzes.has(id);
    const score = completedQuizzes.get(id) || 0;

    res.json({completed, score});
});

// Endpoint to submit quiz answers and score
app.post('/submit-quiz/:id', (req, res) => {
    const {id} = req.params;
    const score = req.body.completionPercentage;

    completedQuizzes.set(id, score);

    res.json({message: `Quiz ${id} successfully completed with a score of ${score}%`});
});

// Starting the server
app.listen(PORT, () => {
    console.log(`Simple Quiz server is running at http://localhost:${PORT}`);
});
