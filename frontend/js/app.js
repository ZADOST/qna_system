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
});

/**
 * Fetches all questions from the database and renders the UI cards
 */
function fetchQuestions() {
    const container = document.getElementById('questionsContainer');
    
    fetch(`${API_BASE_URL}get_questions.php`)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = ''; // Clear loading state

            if (data.message) {
                container.innerHTML = `<div class="alert alert-info text-center w-100">${data.message}</div>`;
                return;
            }

            // Loop through each database record and construct the HTML card
            data.records.forEach(item => {
                const dateObj = new Date(item.created_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                // Ensure data displays correctly regardless of database column names
                const displayAuthor = item.author || item.author_name || 'Student';
                const displayBody = item.body || item.details || '';

                const cardHTML = `
                    <div class="card mb-4 shadow-sm border-0 hover-lift">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="badge bg-primary author-badge px-3 py-2">
                                    <i class="bi bi-person-circle me-1"></i> ${displayAuthor}
                                </span>
                                <small class="text-muted fw-bold">${formattedDate}</small>
                            </div>
                            <h4 class="fw-bold text-dark mb-3">${item.title}</h4>
                            <p class="text-muted text-truncate-multiline" style="font-size: 1.05rem;">${displayBody}</p>
                            
                            <hr class="text-muted my-3">
                            
                            <div class="d-flex justify-content-end">
                                <button onclick="deleteQuestion(${item.id})" class="btn btn-sm btn-outline-danger fw-bold px-3">
                                    Delete Question
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
    
    // FIXED PAYLOAD: The keys now perfectly match what your PHP expects!
    const payload = {
        author: document.getElementById('nameInput') ? document.getElementById('nameInput').value.trim() : 'Anonymous',
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
            msgBox.className = 'alert alert-success mt-3';
            msgBox.innerHTML = '<strong>Success!</strong> Question published. Redirecting...';
            document.getElementById('askForm').reset();
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            msgBox.className = 'alert alert-danger mt-3';
            msgBox.innerHTML = '<strong>Error!</strong> ' + data.message;
            btn.disabled = false;
            btn.innerHTML = 'Publish Question';
        }
    })
    .catch(error => {
        msgBox.className = 'alert alert-danger mt-3';
        msgBox.innerHTML = '<strong>Critical Error!</strong> Could not connect to the server.';
        btn.disabled = false;
        btn.innerHTML = 'Publish Question';
    });
}