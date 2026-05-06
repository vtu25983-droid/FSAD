<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

$data     = json_decode(file_get_contents("php://input"), true);
$id       = intval($data['id']          ?? 0);
$title    = $conn->real_escape_string($data['title']       ?? '');
$desc     = $conn->real_escape_string($data['description'] ?? '');
$category = $conn->real_escape_string($data['category']    ?? '');
$date     = $conn->real_escape_string($data['date']        ?? '');
$time     = $conn->real_escape_string($data['time']        ?? '');
$venue    = $conn->real_escape_string($data['venue']       ?? '');
$capacity = intval($data['capacity'] ?? 100);
$image    = $conn->real_escape_string($data['image_url']   ?? '');

if (!$id || !$title) { echo json_encode(["success"=>false,"error"=>"Missing fields"]); exit(); }
$conn->query("UPDATE events SET title='$title',description='$desc',category='$category',date='$date',time='$time',venue='$venue',capacity=$capacity,image_url='$image' WHERE id=$id");
echo json_encode(["success"=>true,"message"=>"Event updated"]);
$conn->close();
?>
