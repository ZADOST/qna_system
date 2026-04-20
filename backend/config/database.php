<?php
// backend/config/database.php

// Define database credentials
$host = 'localhost';
$db_name = 'qna_system';
$username = 'root'; // Default XAMPP username
$password = '9889';     // Leave empty unless you specifically set a MySQL root password earlier

// Set up the PDO connection
try {
    $dsn = "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch data as associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Use real prepared statements for security
    ];

    $pdo = new PDO($dsn, $username, $password, $options);
    
} catch (PDOException $e) {
    // If the connection fails, return a JSON error
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}
?>