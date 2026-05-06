<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
$sql = $event_id
    ? "SELECT r.*, e.title as event_title FROM registrations r JOIN events e ON r.event_id=e.id WHERE r.event_id=$event_id ORDER BY r.registered_at DESC"
    : "SELECT r.*, e.title as event_title FROM registrations r JOIN events e ON r.event_id=e.id ORDER BY r.registered_at DESC";

$result = $conn->query($sql);
$registrations = [];
while ($row = $result->fetch_assoc()) $registrations[] = $row;

$total = intval($conn->query("SELECT COUNT(*) as c FROM registrations")->fetch_assoc()['c']);
echo json_encode(["success" => true, "registrations" => $registrations, "stats" => ["total_registrations" => $total]]);
$conn->close();
?>
