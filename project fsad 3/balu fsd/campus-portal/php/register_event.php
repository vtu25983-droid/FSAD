<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require_once 'db.php';

$data       = json_decode(file_get_contents("php://input"), true);
$event_id   = intval($data['event_id']     ?? 0);
$name       = $conn->real_escape_string($data['student_name']  ?? '');
$email      = $conn->real_escape_string($data['student_email'] ?? '');
$student_id = $conn->real_escape_string($data['student_id']    ?? '');
$phone      = $conn->real_escape_string($data['phone']         ?? '');
$department = $conn->real_escape_string($data['department']    ?? '');

if (!$event_id || !$name || !$email) {
    echo json_encode(["success" => false, "error" => "Required fields missing"]);
    exit();
}

// Already registered?
$check = $conn->query("SELECT id FROM registrations WHERE event_id=$event_id AND student_email='$email'");
if ($check->num_rows > 0) {
    echo json_encode(["success" => false, "error" => "You are already registered for this event"]);
    exit();
}

// Capacity check
$event_row = $conn->query("SELECT capacity FROM events WHERE id=$event_id")->fetch_assoc();
$reg_count = intval($conn->query("SELECT COUNT(*) as cnt FROM registrations WHERE event_id=$event_id")->fetch_assoc()['cnt']);
if (!$event_row) {
    echo json_encode(["success" => false, "error" => "Event not found"]);
    exit();
}
if ($reg_count >= intval($event_row['capacity'])) {
    echo json_encode(["success" => false, "error" => "Event is fully booked"]);
    exit();
}

$conn->query("INSERT INTO registrations (event_id,student_name,student_email,student_id,phone,department) VALUES ($event_id,'$name','$email','$student_id','$phone','$department')");
echo json_encode(["success" => true, "message" => "Registration successful! See you at the event 🎉"]);
$conn->close();
?>
