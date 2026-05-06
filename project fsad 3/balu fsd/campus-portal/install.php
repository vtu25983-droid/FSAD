<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CampusHub Installer</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',sans-serif; background:#1a1a2e; color:#e0e0e0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { background:#16213e; border:1px solid rgba(108,99,255,0.3); border-radius:20px; padding:2.5rem; max-width:620px; width:100%; }
    h1 { font-size:1.8rem; margin-bottom:0.5rem; }
    h1 span { background:linear-gradient(135deg,#6c63ff,#ff6584); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .step { padding:12px 16px; border-radius:10px; margin:8px 0; font-size:0.9rem; display:flex; align-items:center; gap:10px; }
    .ok   { background:rgba(67,233,123,0.1); border:1px solid rgba(67,233,123,0.3); color:#43e97b; }
    .err  { background:rgba(255,101,132,0.1); border:1px solid rgba(255,101,132,0.3); color:#ff6584; }
    .info { background:rgba(108,99,255,0.1); border:1px solid rgba(108,99,255,0.3); color:#a0a0ff; }
    .btn  { display:inline-block; margin-top:1.5rem; padding:14px 32px; background:linear-gradient(135deg,#6c63ff,#ff6584); color:white; border-radius:12px; text-decoration:none; font-weight:700; font-size:1rem; }
    pre   { background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; font-size:0.78rem; margin-top:6px; color:#ff6584; white-space:pre-wrap; }
  </style>
</head>
<body>
<div class="box">
  <h1>🎓 <span>CampusHub</span> Installer</h1>
  <p style="color:#a0a0b0;margin-bottom:1.5rem;margin-top:0.5rem;">Auto-setting up database, tables and sample data...</p>
<?php
$conn = new mysqli("localhost","root","");
if ($conn->connect_error) {
    echo '<div class="step err">❌ MySQL not reachable: '.$conn->connect_error.'<pre>Start MySQL in XAMPP Control Panel, then refresh this page.</pre></div></div></body></html>';
    exit();
}
echo '<div class="step ok">✅ MySQL connected</div>';

$conn->query("CREATE DATABASE IF NOT EXISTS campus_portal");
$conn->select_db("campus_portal");
echo '<div class="step ok">✅ Database <b>campus_portal</b> ready</div>';

// Users table
$conn->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    student_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
echo '<div class="step ok">✅ Table <b>users</b> ready</div>';

// Events table
$conn->query("CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue VARCHAR(255),
    capacity INT DEFAULT 100,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
echo '<div class="step ok">✅ Table <b>events</b> ready</div>';

// Registrations table
$conn->query("CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
echo '<div class="step ok">✅ Table <b>registrations</b> ready</div>';

// Sample events
$check = $conn->query("SELECT COUNT(*) as cnt FROM events");
$row = $check->fetch_assoc();
if ($row['cnt'] == 0) {
    $events = [
        // Technology
        ["Tech Symposium 2026","Annual technology symposium with talks from industry leaders, researchers and innovators.","Technology","2026-04-10","09:00:00","Main Auditorium",500,"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600"],
        ["AI & Machine Learning Workshop","Hands-on workshop on building ML models using Python, TensorFlow and real datasets.","Technology","2026-04-18","10:00:00","CS Lab 3",80,"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600"],
        ["Hackathon 2026","24-hour coding challenge. Build innovative solutions to real-world problems. Prizes worth ₹1 Lakh.","Technology","2026-04-20","08:00:00","CS Lab Block",200,"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600"],
        ["Web Dev Bootcamp","3-day intensive bootcamp covering React, Node.js and full-stack development.","Technology","2026-05-05","09:00:00","IT Seminar Hall",60,"https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=600"],
        // Cultural
        ["Cultural Fest 2026","Celebrate diversity with music, dance, art and food from around the world. 3-day mega event.","Cultural","2026-04-15","10:00:00","Open Ground",1000,"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600"],
        ["Classical Dance Competition","Inter-college classical dance competition. Bharatanatyam, Kathak, Odissi and more.","Cultural","2026-04-22","05:00:00","College Auditorium",300,"https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600"],
        ["Battle of Bands","Rock, pop, fusion — show off your band's talent. Open to all students.","Cultural","2026-04-28","06:00:00","Open Air Theatre",500,"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600"],
        ["Art Exhibition","Annual student art showcase — paintings, sculptures, digital art and photography.","Cultural","2026-05-08","10:00:00","Art Gallery Hall",200,"https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=600"],
        // Competition
        ["Coding Contest","Competitive programming contest. Solve algorithmic problems and win exciting prizes.","Competition","2026-04-12","02:00:00","CS Lab 1",150,"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600"],
        ["Business Plan Competition","Present your startup idea to a panel of investors and industry experts.","Competition","2026-04-25","10:00:00","MBA Seminar Hall",100,"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600"],
        ["Debate Championship","Inter-department debate on current affairs, technology and social issues.","Competition","2026-05-03","02:00:00","Conference Room A",80,"https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600"],
        ["Quiz Bowl","General knowledge and technical quiz. Teams of 3. Multiple rounds with eliminations.","Competition","2026-05-12","11:00:00","Seminar Hall B",200,"https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600"],
        // Career
        ["Career Fair 2026","Meet top recruiters from 50+ companies. Bring your resume. On-spot interviews available.","Career","2026-05-01","10:00:00","Sports Complex",800,"https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600"],
        ["Resume Building Workshop","Learn to craft an ATS-friendly resume that gets you shortlisted. Expert HR panel.","Career","2026-04-14","02:00:00","Placement Cell",120,"https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600"],
        ["Mock Interview Drive","Practice technical and HR interviews with industry professionals. Get real feedback.","Career","2026-04-30","09:00:00","Placement Block",100,"https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=600"],
        ["LinkedIn & Personal Branding","Build your professional online presence. Tips from recruiters on what they look for.","Career","2026-05-15","03:00:00","Seminar Hall A",150,"https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=600"],
        // Academic
        ["Science Exhibition","Showcase of student research projects and scientific innovations across all departments.","Academic","2026-05-10","09:00:00","Science Block",300,"https://images.unsplash.com/photo-1532094349884-543559059a6b?w=600"],
        ["Research Paper Presentation","Present your research to faculty and peers. Best papers get published in college journal.","Academic","2026-04-16","10:00:00","Research Centre",150,"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600"],
        ["Mathematics Olympiad","Test your problem-solving skills in this annual inter-college math competition.","Academic","2026-04-24","10:00:00","Exam Hall 1",200,"https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600"],
        ["Guest Lecture: Future of Engineering","Distinguished lecture by Dr. Ramesh Kumar, IIT Bombay on emerging engineering trends.","Academic","2026-05-06","11:00:00","Main Auditorium",400,"https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600"],
        // Sports
        ["Sports Day 2026","Annual inter-department sports competition. Athletics, field events and team sports.","Sports","2026-05-20","07:00:00","Sports Ground",2000,"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600"],
        ["Cricket Tournament","Inter-department T20 cricket tournament. Register your team of 11 players.","Sports","2026-04-11","08:00:00","Cricket Ground",500,"https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600"],
        ["Basketball League","5-on-5 basketball league. Round-robin format followed by knockout rounds.","Sports","2026-04-17","04:00:00","Basketball Court",200,"https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600"],
        ["Chess Championship","Classical chess tournament open to all students. FIDE rules apply.","Sports","2026-05-02","10:00:00","Student Activity Centre",100,"https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600"],
    ];

    $stmt = $conn->prepare("INSERT INTO events (title,description,category,date,time,venue,capacity,image_url) VALUES (?,?,?,?,?,?,?,?)");
    $count = 0;
    foreach ($events as $e) {
    $stmt->bind_param("ssssssis", $e[0],$e[1],$e[2],$e[3],$e[4],$e[5],$e[6],$e[7]);
        if ($stmt->execute()) $count++;
    }
    echo '<div class="step ok">✅ '.$count.' sample events inserted across all categories</div>';
} else {
    echo '<div class="step info">ℹ️ Events already exist ('.$row['cnt'].' events) — skipping</div>';
}

$conn->close();
echo '<div class="step ok" style="margin-top:1rem;font-size:1rem;">🎉 <b>Installation complete! Everything is ready.</b></div>';
?>
  <a href="index.html" class="btn">🚀 Open CampusHub Portal →</a>
</div>
</body>
</html>
