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

// Verify that the ID was actually provided
if (!empty($data->id)) {
    
    // Prepare the SQL DELETE statement
    $query = "DELETE FROM questions WHERE id = :id";
    $stmt = $pdo->prepare($query);

    // Sanitize the ID to ensure it is strictly an integer
    $id = htmlspecialchars(strip_tags($data->id));

    // Bind the ID parameter
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);

    // Execute the query
    if ($stmt->execute()) {
        // Check if a row was actually deleted (prevents success messages for non-existent IDs)
        if ($stmt->rowCount() > 0) {
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "message" => "Question successfully deleted."]);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(["status" => "error", "message" => "Question not found. It may have already been deleted."]);
        }
    } else {
        http_response_code(503); // Service Unavailable
        echo json_encode(["status" => "error", "message" => "Unable to delete the question due to a server error."]);
    }
} else {
    // Missing ID
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "Incomplete request. Question ID is missing."]);
}
?>