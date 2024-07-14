/**
 * Quiz App. UI manager.
 */
document.addEventListener('DOMContentLoaded', function () {
    const SUCCESS_LOWER_THRESHOLD = 75;
    const SUCCESS_UPPER_THRESHOLD = 90;
    const quizDataContainer = document.getElementById('quizDataContainer');
    const submitButton = document.getElementById('submitButton');
    const quizSelect = document.getElementById('quizSelect');
    const takenPanel = document.createElement('div');

    takenPanel.id = 'takenPanel';
    takenPanel.style.display = 'none';
    document.body.insertBefore(takenPanel, quizDataContainer);

    // Fetching quiz titles from the server
    fetch('/quiz-titles')
        .then(response => response.json())
        .then(data => {
            // The dropdown menu is populated with quiz titles
            let quizId = 0;
            data.forEach(quiz => {
                const option = document.createElement('option');
                option.textContent = quiz.title;
                option.value = ++quizId;
                quizSelect.appendChild(option);
            });

            // Loading the first quiz
            if (data.length > 0) {
                loadQuiz(1);
            }
        })
        .catch(error => console.error('Error fetching quiz titles:', error));

    function checkQuizCompletion(quizId) {
        // Checking if quiz has already been completed in the current session
        fetch(`/check-quiz/${quizId}`)
            .then(response => response.json())
            .then(data => {
                if (data.completed) {
                    // Disabling submit button if it is taken (submitted)
                    submitButton.disabled = true;
                    updateCompletionPanel(quizId, data.score);
                    takenPanel.style.display = 'block';
                    // Making quiz content grey, means taken
                    quizDataContainer.style.color = 'grey';
                    takenPanel.style.backgroundColor = getCompletionPanelColor(data.score); // Set background color based on score
                    console.log(`Quiz ${quizId} already completed in this session with score ${data.score}`);
                } else {
                    // Enabling the submit button if the quiz is completed
                    submitButton.disabled = false;
                    takenPanel.style.display = 'none';
                    // Restoring default color for not taken quiz
                    quizDataContainer.style.color = 'black';
                    console.log(`Quiz ${quizId} not completed in this session`);
                }
            })
            .catch(error => console.error(`Error checking quiz ${quizId} completion:`, error));
    }

    async function updateTotalScore() {
        try {
            const response = await fetch('/total');
            const data = await response.json();
            const total = data.total.toFixed(2)
            document.getElementById('totalScore_id').innerText = `(${total}%)`;
        } catch (error) {
            console.error('Error fetching total score:', error);
        }
    }

    function loadQuiz(id) {
        const selectedQuiz = id ? id : quizSelect.value;
        if (selectedQuiz) {
            // Load quiz data based on selected quiz
            fetch(`/quizzes/${selectedQuiz}`) // Assuming endpoint to fetch individual quiz data
                .then(response => response.json())
                .then(quizData => {
                    console.log('Loaded quiz:', quizData.title);
                    initializeQuiz(quizData);
                    checkQuizCompletion(selectedQuiz);
                })
                .catch(error => console.error('Error loading quiz data:', error));
        } else {
            console.log('Please select a quiz.');
        }
        updateTotalScore();
    }

    // Event listener for combobox change event
    quizSelect.addEventListener('change', function () {
        loadQuiz();
    });

    function initializeQuiz(quizData) {
        quizDataContainer.innerHTML = '';
        const questions = quizData.questions;

        questions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
            questionDiv.id = `question${question.id}`;

            let optionsHtml = '';
            question.options.forEach(option => {
                optionsHtml += `<label class="option"><input type="radio" name="q${question.id}" value="${option.value}"> ${option.text}</label>`;
            });

            questionDiv.innerHTML = `
        <p><strong>${question.id}. ${question.prompt}</strong></p>
        <div class="options">
          ${optionsHtml}
        </div>
        <p class="result"></p>
        <p class="explanation" style="display:none">Explanation: ${question.explanation}</p>
      `;

            quizDataContainer.appendChild(questionDiv);
        });

        // Event listener for the submit button click
        submitButton.addEventListener('click', function () {
            const selectedQuizId = quizSelect.value;
            const completionPercentage = evaluateQuiz(quizData, selectedQuizId);
            // Submitting quiz answers
            fetch(`/submit-quiz/${selectedQuizId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({completionPercentage: completionPercentage})
                }
            )
                .then(response => response.json())
                .then(data => {
                    console.log('OK', data.message);
                    // Disabling submit button after successful submission
                    submitButton.disabled = true;
                    updateTotalScore();
                })
                .catch(error => console.error('Error submitting quiz:', error));
        });
    }

    function evaluateQuiz(quizData, quizId) {
        const questions = document.querySelectorAll('.question');
        let correctAnswersCount = 0;
        let totalQuestions = questions.length;

        questions.forEach(question => {
            const answer = question.querySelector('input:checked');
            const result = question.querySelector('.result');
            const explanation = question.querySelector('.explanation');

            if (!answer) {
                result.textContent = 'No answer selected!';
                result.classList.add('incorrect');
                explanation.style.display = 'block';
                return;
            }

            const questionId = question.id.replace('question', '');
            const questionData = quizData.questions.find(q => q.id === parseInt(questionId));

            // The previous results and explanations must be reset
            result.textContent = '';
            result.classList.remove('correct', 'incorrect');
            explanation.style.display = 'none';

            // Checking if the selected answer is correct
            if (answer.value === questionData.correctAnswer) {
                result.textContent = 'Correct!';
                result.classList.add('correct');
                correctAnswersCount++;
            } else {
                result.textContent = 'Incorrect!';
                result.classList.add('incorrect');
                explanation.style.display = 'block';
            }
        });

        let completionPercentage = (correctAnswersCount / totalQuestions) * 100;
        showCompletionPanel(quizId, completionPercentage.toFixed(2));
        return completionPercentage;
    }

    function showCompletionPanel(quizId, completionPercentage) {
        updateCompletionPanel(quizId, completionPercentage);
        takenPanel.style.display = 'block';
        quizDataContainer.style.color = 'grey'; // Make quiz content grey
    }

    function updateCompletionPanel(quizId, completionPercentage) {
        let panelColor = getCompletionPanelColor(completionPercentage);

        takenPanel.style.color = panelColor.color; // Text color
        takenPanel.style.borderColor = panelColor.color; // Border color
        takenPanel.style.backgroundColor = panelColor.bkg; // Body background color
        if (completionPercentage < SUCCESS_LOWER_THRESHOLD) {
            takenPanel.textContent = `Quiz has been completed. Score: ${completionPercentage}%`;
        } else {
            takenPanel.textContent = `Quiz has been successfully completed. Score: ${completionPercentage}%`;
        }
    }

    function getCompletionPanelColor(completionPercentage) {
        const setColor = (color, bkg) => {
            return {color: color, bkg: bkg};
        };
        if (completionPercentage < SUCCESS_LOWER_THRESHOLD) {
            return setColor('red', '#FAA');
        } else if (
            completionPercentage >= SUCCESS_LOWER_THRESHOLD
            && completionPercentage < SUCCESS_UPPER_THRESHOLD) {
            return setColor('#AA0', '#FFA');
        } else {
            return setColor('green', '#AFA');
        }
    }
});
