<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$data     = json_decode(file_get_contents("php://input"), true);
$title    = $conn->real_escape_string($data['title']       ?? '');
$desc     = $conn->real_escape_string($data['description'] ?? '');
$category = $conn->real_escape_string($data['category']    ?? '');
$date     = $conn->real_escape_string($data['date']        ?? '');
$time     = $conn->real_escape_string($data['time']        ?? '');
$venue    = $conn->real_escape_string($data['venue']       ?? '');
$capacity = intval($data['capacity'] ?? 100);
$image    = $conn->real_escape_string($data['image_url']   ?? '');

if (!$title || !$date || !$venue) {
    echo json_encode(["success" => false, "error" => "Title, date and venue are required"]);
    exit();
}
$conn->query("INSERT INTO events (title,description,category,date,time,venue,capacity,image_url) VALUES ('$title','$desc','$category','$date','$time','$venue',$capacity,'$image')");
echo json_encode(["success" => true, "message" => "Event added!", "id" => $conn->insert_id]);
$conn->close();
?>
