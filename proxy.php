<?php
// ============================================================
// proxy.php — SquarePulse CORS Proxy
// Upload this file alongside index.html on your PHP hosting
// ============================================================

// Allow all origins (your frontend can call this)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle browser preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['code' => 'ERR', 'message' => 'Only POST allowed']);
    exit();
}

// ── Read incoming JSON body ───────────────────────────────
$body = file_get_contents('php://input');
$payload = json_decode($body, true);

if (!$payload) {
    echo json_encode(['code' => 'ERR', 'message' => 'Invalid JSON body']);
    exit();
}

// ── Required fields ───────────────────────────────────────
$apiKey  = isset($payload['apiKey'])  ? trim($payload['apiKey'])  : '';
$content = isset($payload['content']) ? trim($payload['content']) : '';

if (empty($apiKey)) {
    echo json_encode(['code' => 'ERR', 'message' => 'API Key missing']);
    exit();
}

if (empty($content)) {
    echo json_encode(['code' => 'ERR', 'message' => 'Content is empty']);
    exit();
}

// ── Forward request to Binance Square API ─────────────────
$postData = json_encode(['bodyTextOnly' => $content]);

$ch = curl_init('https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $postData,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'X-Square-OpenAPI-Key: ' . $apiKey,
        'clienttype: binanceSkill',
    ],
]);

$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ── Return response ───────────────────────────────────────
if ($curlErr) {
    echo json_encode([
        'code'    => 'CURL_ERR',
        'message' => 'Server error: ' . $curlErr
    ]);
    exit();
}

// Pass Binance response directly back to frontend
http_response_code($httpCode);
echo $response;
