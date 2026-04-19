<?php
// Set headers to allow cross-origin requests and define the response as JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include the database connection file
require_once '../config/database.php';

// Retrieve the raw posted data
$data = json_decode(file_get_contents("php://input"));

// Verify that the required fields are not empty
if (!empty($data->title) && !empty($data->body) && !empty($data->author)) {
    
    // Prepare the SQL INSERT statement
    $query = "INSERT INTO questions (author, title, body) VALUES (:author, :title, :body)";
    $stmt = $pdo->prepare($query);

    // Sanitize the inputs to prevent malicious code execution
    $author = htmlspecialchars(strip_tags($data->author));
    $title = htmlspecialchars(strip_tags($data->title));
    $body = htmlspecialchars(strip_tags($data->body));

    // Bind the sanitized variables to the SQL statement
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':body', $body);

    // Execute the query
    if ($stmt->execute()) {
        http_response_code(201); // 201 Created
        echo json_encode(["status" => "success", "message" => "Question was submitted successfully."]);
    } else {
        http_response_code(503); // 503 Service Unavailable
        echo json_encode(["status" => "error", "message" => "Unable to submit your question at this time."]);
    }
} else {
    // Tell the user the data is incomplete
    http_response_code(400); // 400 Bad Request
    echo json_encode(["status" => "error", "message" => "Incomplete data. Please provide author, title, and body."]);
}
?>