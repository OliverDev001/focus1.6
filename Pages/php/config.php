<?php
//corrigir IA por inteiro!!!!
loadEnv('C:/wamp64/www/.env'); //mudar sempre que abrir nova connection

//Bloco referente ao .env do arquivo
function loadEnv($path)
{
    if (!file_exists($path)) {
        throw new Exception("Nenhum arquivo .env Detectado!" . mysqli_connect_error());
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;

        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . "=" . trim($value));
    }
}

$API_KEY = getenv('API_KEY');


// CONEXÃO COM BANCO
require_once __DIR__ . "/MySQLClass.php";

$conn = getConnection();

if ($conn->connect_error) {
    die("Erro DB: " . $conn->connect_error);
}

// QUERY DOS HÁBITOS
$sql = "
SELECT * FROM tasks_view WHERE Profile_id = 3;
";

$result = $conn->query($sql);

$habits = [];

while ($row = $result->fetch_assoc()) {
    $habits[] = $row;
}

// PROMPT 
$PROMPT = "
Você é um assistente de produtividade humano e direto.

Dados:
" . json_encode($habits, JSON_UNESCAPED_UNICODE) . "

Mensagem:
{USER_INPUT}

REGRAS:
- Responda em UM único parágrafo (sem tópicos, listas ou emojis)
- Linguagem natural, como conversa (não robótico)
- Inclua de forma fluida: produtividade (%), hábitos, insight, melhoria e motivação
- Foque apenas em ações futuras (não altera passado)

FORA DO TEMA:
Se o usuário fugir de produtividade/tarefas, responda apenas:
'Não posso falar sobre outros assuntos aqui, o foco é sua produtividade. Vamos voltar pras suas tarefas e melhorar seu desempenho.'
";