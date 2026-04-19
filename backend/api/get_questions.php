<?php
// Set headers to allow cross-origin requests and define the response as JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include the database connection file
require_once '../config/database.php';

// Prepare the SQL SELECT statement to fetch all questions, newest first
$query = "SELECT id, author, title, body, created_at FROM questions ORDER BY created_at DESC";
$stmt = $pdo->prepare($query);

// Execute the query
$stmt->execute();

// Check if any questions exist
$num = $stmt->rowCount();

if ($num > 0) {
    // Create an array to hold the results
    $questions_arr = array();
    $questions_arr["records"] = array();

    // Fetch the rows one by one
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Extract variables from the row
        extract($row);

        $question_item = array(
            "id" => $id,
            "author" => $author,
            "title" => $title,
            "body" => html_entity_decode($body),
            "created_at" => $created_at
        );

        // Push the item into the records array
        array_push($questions_arr["records"], $question_item);
    }

    // Set response code and output the JSON data
    http_response_code(200); // 200 OK
    echo json_encode($questions_arr);
} else {
    // Set response code to 404 Not Found if the table is empty
    http_response_code(404);
    echo json_encode(array("message" => "No questions found yet. Be the first to ask!"));
}
?>