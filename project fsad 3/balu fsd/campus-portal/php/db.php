<?php
$conn = new mysqli("localhost", "root", "", "campus_portal");
if ($conn->connect_error) {
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "error" => "DB Error: " . $conn->connect_error]);
    exit();
}
$conn->set_charset("utf8mb4");
?>
