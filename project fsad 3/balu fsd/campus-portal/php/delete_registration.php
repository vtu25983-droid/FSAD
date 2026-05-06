<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';
$id = intval($_GET['id'] ?? 0);
if (!$id) { echo json_encode(["success"=>false,"error"=>"Invalid ID"]); exit(); }
$conn->query("DELETE FROM registrations WHERE id=$id");
echo json_encode(["success"=>true,"message"=>"Registration removed"]);
$conn->close();
?>
