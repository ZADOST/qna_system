// frontend/js/app.js

// Define the base path for the PHP API
const API_BASE_URL = 'http://localhost/qna_system/backend/api/';

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Dashboard Logic (index.html)
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer) {
        fetchQuestions();
    }

    // 2. Submission Form Logic (ask.html)
    const askForm = document.getElementById('askForm');
    if (askForm) {
        askForm.addEventListener('submit', handleAskSubmit);
    }

    // 3. Discussion Thread Logic (question.html)
    const questionDetailsCard = document.getElementById('questionDetailsCard');
    if (questionDetailsCard) {
        // Grab the ID from the URL (e.g., question.html?id=5)
        const urlParams = new URLSearchParams(window.location.search);
        const questionId = urlParams.get('id');
        
        if (questionId) {
            loadQuestionThread(questionId);
            
            // Attach listener to the answer form
            const answerForm = document.getElementById('answerForm');
            if (answerForm) {
                answerForm.addEventListener('submit', (e) => handleAnswerSubmit(e, questionId));
            }
        } else {
            document.getElementById('qContent').innerHTML = '<div class="alert alert-danger">Question not found.</div>';
            document.getElementById('qContent').classList.remove('d-none');
            document.getElementById('qLoadingSpinner').classList.add('d-none');
        }
    }
});

/**
 * Fetches all questions from the database and renders the UI cards for index.html
 */
function fetchQuestions() {
    const container = document.getElementById('questionsContainer');
    
    fetch(`${API_BASE_URL}get_questions.php`)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = ''; 

            if (data.message) {
                container.innerHTML = `<div class="alert alert-info text-center w-100">${data.message}</div>`;
                return;
            }

            data.records.forEach(item => {
                const dateObj = new Date(item.created_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                const displayAuthor = item.author || item.author_name || 'Student';
                const displayBody = item.body || item.details || '';

                // Notice we added a hyperlink wrapping the title so users can click into the thread!
                const cardHTML = `
                    <div class="card mb-4 shadow-sm border-0 hover-lift question-card">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-primary author-badge px-3 py-2">
                                    <i class="bi bi-person-circle me-1"></i> ${displayAuthor}
                                </span>
                                <small class="text-muted fw-bold">${formattedDate}</small>
                            </div>
                            <a href="question.html?id=${item.id}" class="text-decoration-none">
                                <h4 class="fw-bold text-dark mb-3 card-title">${item.title}</h4>
                            </a>
                            <p class="text-muted text-truncate-multiline" style="font-size: 1.05rem;">${displayBody}</p>
                            
                            <hr class="text-muted my-3">
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <a href="question.html?id=${item.id}" class="btn btn-sm btn-light fw-bold text-primary">View Discussion</a>
                                <button onclick="deleteQuestion(${item.id})" class="btn btn-sm btn-outline-danger fw-bold px-3">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        })
        .catch(error => {
            console.error('API Error:', error);
            container.innerHTML = `<div class="alert alert-danger text-center">Failed to connect to the Q&A database.</div>`;
        });
}

/**
 * Handles the deletion of a specific question using its unique database ID
 */
function deleteQuestion(questionId) {
    const isConfirmed = confirm("Are you sure you want to permanently delete this question from the Student Talks platform?");
    
    if (!isConfirmed) {
        return; 
    }

    fetch(`${API_BASE_URL}delete_question.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: questionId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fetchQuestions();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Deletion Error:', error);
        alert('A network error occurred while trying to delete the question.');
    });
}

/**
 * Handles the submission of a new question on ask.html
 */
function handleAskSubmit(e) {
    e.preventDefault(); 

    const btn = document.getElementById('submitBtn');
    const msgBox = document.getElementById('formMessage');
    
    const payload = {
        author: document.getElementById('authorInput') ? document.getElementById('authorInput').value.trim() : 'Anonymous',
        title: document.getElementById('titleInput').value.trim(),
        body: document.getElementById('bodyInput') ? document.getElementById('bodyInput').value.trim() : ''
    };

    btn.disabled = true;
    btn.innerHTML = 'Publishing...';

    fetch(`${API_BASE_URL}add_question.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            msgBox.classList.remove('d-none', 'alert-danger');
            msgBox.classList.add('alert-success');
            msgBox.innerHTML = '<strong>Success!</strong> Question published. Redirecting...';
            document.getElementById('askForm').reset();
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            msgBox.classList.remove('d-none', 'alert-success');
            msgBox.classList.add('alert-danger');
            msgBox.innerHTML = '<strong>Error!</strong> ' + data.message;
            btn.disabled = false;
            btn.innerHTML = 'Publish Question';
        }
    })
    .catch(error => {
        msgBox.classList.remove('d-none', 'alert-success');
        msgBox.classList.add('alert-danger');
        msgBox.innerHTML = '<strong>Critical Error!</strong> Could not connect to the server.';
        btn.disabled = false;
        btn.innerHTML = 'Publish Question';
    });
}

/**
 * Loads a specific question and its answers for question.html
 */
function loadQuestionThread(questionId) {
    // 1. Fetch the question details (Filtering from get_questions for simplicity)
    fetch(`${API_BASE_URL}get_questions.php`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('qLoadingSpinner').classList.add('d-none');
            const contentDiv = document.getElementById('qContent');
            contentDiv.classList.remove('d-none');

            if (data.records) {
                const question = data.records.find(q => q.id == questionId);
                if (question) {
                    const dateObj = new Date(question.created_at);
                    document.getElementById('qTitle').innerText = question.title;
                    document.getElementById('qAuthor').innerHTML = `<i class="bi bi-person-circle me-1"></i> ${question.author}`;
                    document.getElementById('qDate').innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    document.getElementById('qBody').innerText = question.body;
                    
                    // Now fetch the answers for this specific question
                    fetchAnswers(questionId);
                } else {
                    contentDiv.innerHTML = '<div class="alert alert-danger">Question not found in the database.</div>';
                }
            }
        })
        .catch(err => console.error(err));
}

/**
 * Fetches answers for a specific question ID
 */
function fetchAnswers(questionId) {
    const answersContainer = document.getElementById('answersContainer');
    const answerCount = document.getElementById('answerCount');

    fetch(`${API_BASE_URL}get_answers.php?question_id=${questionId}`)
        .then(response => response.json())
        .then(data => {
            answersContainer.innerHTML = '';
            if (data.message) {
                answersContainer.innerHTML = `<p class="text-muted fst-italic">${data.message}</p>`;
                answerCount.innerText = '0';
                return;
            }

            answerCount.innerText = data.records.length;
            data.records.forEach(ans => {
                const dObj = new Date(ans.created_at);
                const fDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                
                const ansHTML = `
                    <div class="card border-0 shadow-sm mb-3 bg-white">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="fw-bold text-primary"><i class="bi bi-reply-fill"></i> ${ans.author}</span>
                                <small class="text-muted">${fDate}</small>
                            </div>
                            <p class="mb-0 text-dark">${ans.answer_text}</p>
                        </div>
                    </div>
                `;
                answersContainer.innerHTML += ansHTML;
            });
        })
        .catch(err => console.error(err));
}

/**
 * Handles the submission of a new answer on question.html
 */
function handleAnswerSubmit(e, questionId) {
    e.preventDefault();

    const btn = document.getElementById('submitAnsBtn');
    const msgBox = document.getElementById('answerFormMessage');
    
    const payload = {
        question_id: questionId,
        author: document.getElementById('ansAuthorInput').value.trim(),
        answer_text: document.getElementById('ansBodyInput').value.trim()
    };

    btn.disabled = true;
    btn.innerHTML = 'Posting...';

    fetch(`${API_BASE_URL}add_answer.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            document.getElementById('answerForm').reset();
            fetchAnswers(questionId); // Instantly reload answers
            msgBox.classList.add('d-none');
            btn.disabled = false;
            btn.innerHTML = 'Post Answer';
        } else {
            msgBox.classList.remove('d-none', 'alert-success');
            msgBox.classList.add('alert-danger');
            msgBox.innerHTML = data.message;
            btn.disabled = false;
            btn.innerHTML = 'Post Answer';
        }
    })
    .catch(error => {
        msgBox.classList.remove('d-none');
        msgBox.classList.add('alert-danger');
        msgBox.innerHTML = 'Network error while posting answer.';
        btn.disabled = false;
        btn.innerHTML = 'Post Answer';
    });
}