<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$name  = $data['name']  ?? null;
$email = $data['email'] ?? null;
$phone = $data['phone'] ?? null;
$city  = $data['city']  ?? null;
$bid   = $data['bid']   ?? null;

if (!$name || !$email || !$phone || !$city || !$bid) {
    http_response_code(400);
    echo json_encode(['error' => 'Campos obrigatórios faltando']);
    exit;
}

// Config privada, fora da pasta pública do site
$config = require __DIR__ . '/../config/secrets.php';

$payload = json_encode([
    'from'    => 'Domain Bid <onboarding@resend.dev>',
    'to'      => $config['OWNER_EMAIL'],
    'subject' => "Nova proposta: $bid",
    'html'    => "
        <h2>Nova proposta recebida</h2>
        <p><strong>Nome/Empresa:</strong> $name</p>
        <p><strong>E-mail:</strong> $email</p>
        <p><strong>Telefone:</strong> $phone</p>
        <p><strong>Cidade:</strong> $city</p>
        <p><strong>Proposta:</strong> $bid</p>
    ",
]);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $config['RESEND_API_KEY'],
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => $payload,
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status >= 200 && $status < 300) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao processar sua proposta']);
}