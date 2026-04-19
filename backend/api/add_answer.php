<?php
// Set headers for CORS and JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include the database connection
require_once '../config/database.php';

// Get the raw POST data
$data = json_decode(file_get_contents("php://input"));

// Verify that the required data is present
if (!empty($data->question_id) && !empty($data->author) && !empty($data->answer_text)) {
    
    // Prepare the SQL statement
    $query = "INSERT INTO answers (question_id, author, answer_text) VALUES (:question_id, :author, :answer_text)";
    $stmt = $pdo->prepare($query);

    // Sanitize the inputs
    $question_id = htmlspecialchars(strip_tags($data->question_id));
    $author = htmlspecialchars(strip_tags($data->author));
    $answer_text = htmlspecialchars(strip_tags($data->answer_text));

    // Bind parameters
    $stmt->bindParam(':question_id', $question_id);
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':answer_text', $answer_text);

    // Execute the query
    if ($stmt->execute()) {
        http_response_code(201); // Created
        echo json_encode(["status" => "success", "message" => "Answer posted successfully."]);
    } else {
        http_response_code(503); // Service Unavailable
        echo json_encode(["status" => "error", "message" => "Unable to post answer at this time."]);
    }
} else {
    // Missing data
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "Incomplete data. Please provide question_id, author, and answer_text."]);
}
?>