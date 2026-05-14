<?php
session_start();
require_once 'MySQLClass.php';
$db = new MySQLClass(); //corrigido

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION["profile_id"])) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Sessão Inválida']);
    exit;
}

$profileId = $_SESSION["profile_id"];
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo === "GET") {
        $sql = "SELECT 
            t.task_id, 
            t.title, 
            COALESCE(sd.done, 0) as done 
        FROM tasks t
        LEFT JOIN schedulings sd ON t.task_id = sd.task_id
        LEFT JOIN schedules s ON sd.schedule_id = s.schedule_id
        WHERE t.profile_id = ? 
        AND (DATE(s.start_time) = ? OR s.start_time IS NULL)
        ORDER BY t.created_at DESC";

        $dataHoje = date('Y-m-d');
        $resultado = $db->searchSafe($sql, [$profileId, $dataHoje]);
        echo json_encode($resultado ?: []);
        exit;
    }

    // --- LÓGICA DE AÇÃO (POST) ---
    else if ($metodo === "POST" && isset($_POST['acao'])) {
        $acao = $_POST['acao'];
        $task_id = $_POST['task_id'] ?? null;

        // Verifica se o task_id existe antes de tentar qualquer ação
        if (!$task_id) {
            echo json_encode(['sucesso' => false, 'erro' => 'ID da tarefa não fornecido.']);
            exit;
        }

        if ($acao === 'toggle') {
            // Alterna o status de conclusão
            $sql = "UPDATE schedulings SET done = IF(done = 1, 0, 1) WHERE task_id = ?";
            $db->execSafe($sql, [$task_id]);

            // Bonus de XP
            $db->execSafe("UPDATE profiles SET xp = xp + 5 WHERE profile_id = ?", [$profileId]);

            echo json_encode(['sucesso' => true]);
            exit;
        } else if ($acao === 'deletar') {
            $conn = $db->getConnection();
            try {
                $conn->begin_transaction();

                // 1. Remove da tabela de agendamentos primeiro (devido à chave estrangeira)
                $db->execSafe("DELETE FROM schedulings WHERE task_id = ?", [$task_id]);

                // 2. Remove da tabela de tarefas (garantindo que pertence ao usuário logado)
                $db->execSafe("DELETE FROM tasks WHERE task_id = ? AND profile_id = ?", [$task_id, $profileId]);

                $conn->commit();
                echo json_encode(['sucesso' => true]);
            } catch (Exception $e) {
                if (isset($conn)) $conn->rollback();
                echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
            }
            exit;
        }
    }
}
// Fechamento do bloco try principal que deve envolver todo o código acima
catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
}

exit;
