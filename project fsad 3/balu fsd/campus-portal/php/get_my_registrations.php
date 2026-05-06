<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$email = $conn->real_escape_string($_GET['email'] ?? '');
if (!$email) {
    echo json_encode(["success" => false, "error" => "Email required"]);
    exit();
}

$result = $conn->query("
    SELECT r.id, r.event_id, r.student_name, r.student_email, r.student_id,
           r.phone, r.department, r.registered_at,
           e.title, e.category, e.date, e.time, e.venue, e.capacity, e.image_url,
           (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registered_count
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.student_email = '$email'
    ORDER BY r.registered_at DESC
");

$registrations = [];
while ($row = $result->fetch_assoc()) $registrations[] = $row;

echo json_encode(["success" => true, "registrations" => $registrations, "count" => count($registrations)]);
$conn->close();
?>
