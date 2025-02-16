<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// 数据库连接配置
$db_config = [
    'host' => 'localhost',
    'user' => 'root',
    'password' => '123',
    'database' => 'notes_app',
    'port' => 3307  // 添加端口配置
];

try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset=utf8",
        $db_config['user'],
        $db_config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => '数据库连接失败：' . $e->getMessage()]));
}

// 获取请求方法和操作类型
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch($method) {
    case 'GET':
        if ($action === 'getAllNotes') {
            $userId = $_GET['user_id'] ?? 0;
            $stmt = $pdo->prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($action === 'getNote') {
            // 获取单个笔记，添加用户ID验证
            $id = $_GET['id'] ?? 0;
            $userId = $_GET['user_id'] ?? 0;
            $stmt = $pdo->prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
        }
        break;

    case 'POST':
        if ($action === 'login') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // 查找用户
            $stmt = $pdo->prepare('SELECT id, username, password FROM users WHERE username = ?');
            $stmt->execute([$data['username']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !password_verify($data['password'], $user['password'])) {
                echo json_encode(['error' => '用户名或密码错误']);
                break;
            }
            
            // 返回用户信息（不包含密码）
            unset($user['password']);
            echo json_encode(['success' => true] + $user);
        } elseif ($action === 'register') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // 验证用户名是否已存在
            $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
            $stmt->execute([$data['username']]);
            if ($stmt->fetch()) {
                echo json_encode(['error' => '用户名已存在']);
                break;
            }
            
            // 对密码进行加密
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // 保存用户信息
            $stmt = $pdo->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
            $stmt->execute([$data['username'], $hashedPassword]);
            
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } elseif ($action === 'saveNote') {
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare('INSERT INTO notes (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())');
            $stmt->execute([$data['title'], $data['content'], $data['user_id']]);
            echo json_encode(['id' => $pdo->lastInsertId()]);
        }
        break;

    case 'PUT':
        if ($action === 'updateNote') {
            // 更新笔记，添加用户ID验证
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare('UPDATE notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
            $stmt->execute([$data['title'], $data['content'], $data['id'], $data['user_id']]);
            echo json_encode(['success' => true]);
        }
        break;

    case 'DELETE':
        if ($action === 'deleteNote') {
            // 删除笔记，添加用户ID验证
            $id = $_GET['id'] ?? 0;
            $userId = $_GET['user_id'] ?? 0;
            $stmt = $pdo->prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);
            echo json_encode(['success' => true]);
        }
        break;
}
?> 