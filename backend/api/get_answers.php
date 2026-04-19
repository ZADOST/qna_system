<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include the database connection
require_once '../config/database.php';

// Check if a question_id was provided in the URL
if (isset($_GET['question_id'])) {
    
    // Prepare the SQL statement to fetch answers for the specific question, oldest to newest
    $query = "SELECT id, question_id, author, answer_text, created_at FROM answers WHERE question_id = :question_id ORDER BY created_at ASC";
    $stmt = $pdo->prepare($query);

    // Sanitize and bind the question_id
    $question_id = htmlspecialchars(strip_tags($_GET['question_id']));
    $stmt->bindParam(':question_id', $question_id);

    // Execute the query
    $stmt->execute();
    $num = $stmt->rowCount();

    if ($num > 0) {
        $answers_arr = array();
        $answers_arr["records"] = array();

        // Fetch rows
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            
            $answer_item = array(
                "id" => $id,
                "question_id" => $question_id,
                "author" => $author,
                "answer_text" => html_entity_decode($answer_text),
                "created_at" => $created_at
            );

            array_push($answers_arr["records"], $answer_item);
        }

        http_response_code(200); // OK
        echo json_encode($answers_arr);
    } else {
        // No answers found for this question
        http_response_code(404); // Not Found
        echo json_encode(array("message" => "No answers found yet. Be the first to contribute!"));
    }
} else {
    // The frontend failed to provide a question_id
    http_response_code(400); // Bad Request
    echo json_encode(array("message" => "Missing question_id parameter."));
}
?>