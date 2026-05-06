<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$result = $conn->query("SELECT id, name, email, student_id, department, role, created_at FROM users ORDER BY created_at DESC");
$users = [];
while ($row = $result->fetch_assoc()) $users[] = $row;
echo json_encode(["success" => true, "users" => $users]);
$conn->close();
?>
