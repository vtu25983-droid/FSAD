<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
require_once 'db.php';

$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents("php://input"), true) ?? [];

// Detect role from email domain
function getRoleFromEmail($email) {
    return (stripos($email, '@campushub.com') !== false) ? 'admin' : 'user';
}

if ($action === 'signup') {
    $name  = $conn->real_escape_string($data['name']       ?? '');
    $email = $conn->real_escape_string($data['email']      ?? '');
    $pw    = $data['password'] ?? '';
    $dept  = $conn->real_escape_string($data['department'] ?? '');
    $sid   = $conn->real_escape_string($data['student_id'] ?? '');
    $role  = getRoleFromEmail($data['email'] ?? '');

    if (!$name || !$email || !$pw) {
        echo json_encode(["success"=>false,"error"=>"Name, email and password are required"]);
        exit();
    }
    if (strlen($pw) < 6) {
        echo json_encode(["success"=>false,"error"=>"Password must be at least 6 characters"]);
        exit();
    }
    if ($conn->query("SELECT id FROM users WHERE email='$email'")->num_rows > 0) {
        echo json_encode(["success"=>false,"error"=>"Email already registered. Please sign in."]);
        exit();
    }

    $hash = password_hash($pw, PASSWORD_BCRYPT);
    $conn->query("INSERT INTO users (name,email,password,department,student_id,role) VALUES ('$name','$email','$hash','$dept','$sid','$role')");
    $uid = $conn->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Account created successfully!",
        "user"    => ["id"=>$uid,"name"=>$name,"email"=>$email,"department"=>$dept,"student_id"=>$sid,"role"=>$role]
    ]);

} elseif ($action === 'signin') {
    $email = $conn->real_escape_string($data['email']    ?? '');
    $pw    = $data['password'] ?? '';

    if (!$email || !$pw) {
        echo json_encode(["success"=>false,"error"=>"Email and password are required"]);
        exit();
    }

    $result = $conn->query("SELECT * FROM users WHERE email='$email'");
    if ($result->num_rows === 0) {
        echo json_encode(["success"=>false,"error"=>"No account found. Please sign up first."]);
        exit();
    }

    $user = $result->fetch_assoc();
    if (!password_verify($pw, $user['password'])) {
        echo json_encode(["success"=>false,"error"=>"Incorrect password"]);
        exit();
    }

    unset($user['password']);
    // Auto-detect role from email if not set
    if (empty($user['role'])) {
        $user['role'] = getRoleFromEmail($user['email']);
    }

    echo json_encode([
        "success" => true,
        "message" => "Welcome back, " . $user['name'] . "!",
        "user"    => $user,
        "role"    => $user['role']
    ]);

} elseif ($action === 'admin_login') {
    // Admin login — checks users table with @campushub.com email
    $email = $conn->real_escape_string($data['email']    ?? '');
    $pw    = $data['password'] ?? '';

    if (!$email || !$pw) {
        echo json_encode(["success"=>false,"error"=>"Email and password are required"]);
        exit();
    }

    if (getRoleFromEmail($email) !== 'admin') {
        echo json_encode(["success"=>false,"error"=>"Not an admin email. Use @campushub.com"]);
        exit();
    }

    $result = $conn->query("SELECT * FROM users WHERE email='$email' AND role='admin'");
    if ($result->num_rows === 0) {
        echo json_encode(["success"=>false,"error"=>"Admin account not found. Please sign up first with @campushub.com email."]);
        exit();
    }

    $user = $result->fetch_assoc();
    if (!password_verify($pw, $user['password'])) {
        echo json_encode(["success"=>false,"error"=>"Incorrect password"]);
        exit();
    }

    unset($user['password']);
    echo json_encode([
        "success" => true,
        "message" => "Welcome, Admin " . $user['name'] . "!",
        "admin"   => $user
    ]);

} else {
    echo json_encode(["success"=>false,"error"=>"Invalid action"]);
}
$conn->close();
?>
