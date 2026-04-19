// frontend/js/app.js

// Define the base path for your PHP API
const API_BASE_URL = 'http://localhost/qna_system/backend/api/';

// Wait for the HTML DOM to fully load before running scripts
document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------------------------------------------------
    // 1. Logic for index.html (Main Feed)
    // ---------------------------------------------------------
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer) {
        fetchQuestions();
    }

    // ---------------------------------------------------------
    // 2. Logic for ask.html (Submit Question Form)
    // ---------------------------------------------------------
    const askForm = document.getElementById('askForm');
    if (askForm) {
        askForm.addEventListener('submit', handleAskSubmit);
    }

    // ---------------------------------------------------------
    // 3. Logic for question.html (Single Thread & Answers)
    // ---------------------------------------------------------
    const questionDetailsCard = document.getElementById('questionDetailsCard');
    if (questionDetailsCard) {
        loadThread();
        
        const answerForm = document.getElementById('answerForm');
        if (answerForm) {
            answerForm.addEventListener('submit', handleAnswerSubmit);
        }
    }
});


/**
 * Fetches all questions from the API and renders them on index.html
 */
function fetchQuestions() {
    fetch(`${API_BASE_URL}get_questions.php`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('questionsContainer');
            container.innerHTML = ''; // Clear the loading spinner

            if (data.message) {
                // If the API returns a 404 message (no questions yet)
                container.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted fs-5">${data.message}</p></div>`;
                return;
            }

            // Loop through the records and create HTML cards
            data.records.forEach(q => {
                // Format the timestamp
                const dateObj = new Date(q.created_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                const cardHTML = `
                    <div class="col-md-6 mb-4">
                        <div class="card question-card h-100 p-3">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="author-badge">👤 ${q.author}</span>
                                    <small class="text-muted">${formattedDate}</small>
                                </div>
                                <h5 class="card-title mb-2">${q.title}</h5>
                                <p class="card-text text-muted text-truncate-multiline mb-4">${q.body}</p>
                                <div class="mt-auto">
                                    <a href="question.html?id=${q.id}" class="btn btn-outline-primary btn-sm fw-bold px-3 rounded-pill">View Thread →</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            document.getElementById('questionsContainer').innerHTML = `<div class="alert alert-danger">Failed to load questions from the server.</div>`;
        });
}


/**
 * Handles the submission of a new question on ask.html
 */
function handleAskSubmit(e) {
    e.preventDefault(); // Prevent standard page reload

    const btn = document.getElementById('submitBtn');
    const msgBox = document.getElementById('formMessage');
    
    // Create payload from input values
    const payload = {
        author: document.getElementById('authorInput').value.trim(),
        title: document.getElementById('titleInput').value.trim(),
        body: document.getElementById('bodyInput').value.trim()
    };

    // UI loading state
    btn.disabled = true;
    btn.innerHTML = 'Publishing...';

    fetch(`${API_BASE_URL}add_question.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        msgBox.classList.remove('d-none', 'alert-danger');
        msgBox.classList.add('alert-success');
        msgBox.innerHTML = '<strong>Success!</strong> ' + data.message + ' Redirecting...';
        
        // Clear form
        document.getElementById('askForm').reset();
        
        // Redirect back to home after 2 seconds
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    })
    .catch(error => {
        msgBox.classList.remove('d-none', 'alert-success');
        msgBox.classList.add('alert-danger');
        msgBox.innerHTML = '<strong>Error!</strong> Could not connect to the server.';
        btn.disabled = false;
        btn.innerHTML = 'Publish Question';
    });
}


/**
 * Loads a specific question and its answers on question.html
 */
function loadThread() {
    // Get the ID from the URL parameters (e.g., ?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');

    if (!questionId) {
        document.getElementById('questionDetailsCard').innerHTML = '<div class="alert alert-danger m-4">No question ID provided.</div>';
        return;
    }

    // Fetch all questions to find the specific one (Simple approach for small DB)
    fetch(`${API_BASE_URL}get_questions.php`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('qLoadingSpinner').classList.add('d-none');
            
            if (data.records) {
                // Find the question matching our URL ID
                const q = data.records.find(item => item.id == questionId);
                
                if (q) {
                    const dateObj = new Date(q.created_at);
                    
                    // Inject data into the DOM
                    document.getElementById('qTitle').textContent = q.title;
                    document.getElementById('qAuthor').innerHTML = `👤 ${q.author}`;
                    document.getElementById('qDate').textContent = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    document.getElementById('qBody').textContent = q.body;
                    
                    document.getElementById('qContent').classList.remove('d-none');
                    
                    // Now load the answers for this specific question
                    loadAnswers(questionId);
                } else {
                    document.getElementById('questionDetailsCard').innerHTML = '<div class="alert alert-warning m-4">Question not found.</div>';
                }
            }
        });
}


/**
 * Fetches answers for a specific question ID
 */
function loadAnswers(questionId) {
    const container = document.getElementById('answersContainer');
    const countBadge = document.getElementById('answerCount');
    
    // We will build get_answers.php to accept a GET parameter
    fetch(`${API_BASE_URL}get_answers.php?question_id=${questionId}`)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            
            if (data.message) {
                container.innerHTML = '<p class="text-muted fst-italic">No answers yet. Be the first to contribute!</p>';
                countBadge.textContent = '0';
                return;
            }

            countBadge.textContent = data.records.length;

            data.records.forEach(ans => {
                const dateObj = new Date(ans.created_at);
                const html = `
                    <div class="card mb-3 border-0 shadow-sm rounded-3">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-bold text-primary">${ans.author}</span>
                                <small class="text-muted">${dateObj.toLocaleDateString()}</small>
                            </div>
                            <p class="mb-0 text-dark">${ans.answer_text}</p>
                        </div>
                    </div>
                `;
                container.innerHTML += html;
            });
        })
        .catch(error => {
            container.innerHTML = '<div class="alert alert-danger">Could not load answers.</div>';
        });
}


/**
 * Handles submitting a new answer on question.html
 */
function handleAnswerSubmit(e) {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');
    const msgBox = document.getElementById('answerFormMessage');
    const btn = document.getElementById('submitAnsBtn');

    const payload = {
        question_id: questionId,
        author: document.getElementById('ansAuthorInput').value.trim(),
        answer_text: document.getElementById('ansBodyInput').value.trim()
    };

    btn.disabled = true;
    btn.innerHTML = 'Posting...';

    // We will build add_answer.php next
    fetch(`${API_BASE_URL}add_answer.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        msgBox.classList.remove('d-none', 'alert-danger');
        msgBox.classList.add('alert-success');
        msgBox.innerHTML = 'Answer posted!';
        
        document.getElementById('answerForm').reset();
        
        // Reload answers to show the new one instantly
        loadAnswers(questionId);
        
        setTimeout(() => { msgBox.classList.add('d-none'); }, 3000);
        btn.disabled = false;
        btn.innerHTML = 'Post Answer';
    })
    .catch(error => {
        msgBox.classList.remove('d-none', 'alert-success');
        msgBox.classList.add('alert-danger');
        msgBox.innerHTML = 'Failed to post answer.';
        btn.disabled = false;
        btn.innerHTML = 'Post Answer';
    });
}