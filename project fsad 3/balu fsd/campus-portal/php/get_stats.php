<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$stats = [];
$stats['total_events']        = intval($conn->query("SELECT COUNT(*) as c FROM events")->fetch_assoc()['c']);
$stats['total_registrations'] = intval($conn->query("SELECT COUNT(*) as c FROM registrations")->fetch_assoc()['c']);
$stats['total_users']         = intval($conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c']);

$r = $conn->query("SELECT category, COUNT(*) as cnt FROM events GROUP BY category");
$cats = [];
while ($row = $r->fetch_assoc()) $cats[$row['category']] = intval($row['cnt']);
$stats['by_category'] = $cats;

$r = $conn->query("SELECT e.title, COUNT(r.id) as cnt FROM events e LEFT JOIN registrations r ON e.id=r.event_id GROUP BY e.id ORDER BY cnt DESC LIMIT 5");
$top = [];
while ($row = $r->fetch_assoc()) $top[] = $row;
$stats['top_events'] = $top;

$r = $conn->query("SELECT r.student_name, r.student_email, r.department, e.title as event_title, r.registered_at FROM registrations r JOIN events e ON r.event_id=e.id ORDER BY r.registered_at DESC LIMIT 5");
$recent = [];
while ($row = $r->fetch_assoc()) $recent[] = $row;
$stats['recent_activity'] = $recent;
$stats['timestamp'] = date('Y-m-d H:i:s');

echo json_encode(["success" => true, "stats" => $stats]);
$conn->close();
?>
