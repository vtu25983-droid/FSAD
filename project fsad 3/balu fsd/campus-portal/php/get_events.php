<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
$search   = isset($_GET['search'])   ? $conn->real_escape_string($_GET['search'])   : '';

$sql = "SELECT e.id, e.title, e.description, e.category, e.date, e.time,
               e.venue, e.capacity, e.image_url, e.created_at,
               COUNT(r.id) as registered_count
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id
        WHERE 1=1";

if ($category && $category !== 'All') {
    $sql .= " AND e.category = '$category'";
}
if ($search) {
    $sql .= " AND (e.title LIKE '%$search%' OR e.description LIKE '%$search%' OR e.venue LIKE '%$search%')";
}
$sql .= " GROUP BY e.id ORDER BY e.date ASC";

$result = $conn->query($sql);
if (!$result) {
    echo json_encode(["success" => false, "error" => $conn->error]);
    exit();
}

$events = [];
while ($row = $result->fetch_assoc()) {
    $row['registered_count'] = intval($row['registered_count']);
    $row['capacity']         = intval($row['capacity']);
    $row['spots_left']       = $row['capacity'] - $row['registered_count'];
    $events[] = $row;
}
echo json_encode(["success" => true, "events" => $events]);
$conn->close();
?>
