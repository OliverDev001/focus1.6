<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * @param string|null $perfilNecessario 'admin' ou null
 */
function proteger($perfilNecessario = null)
{
    // Verifica se o usuário básico está logado
    if (!isset($_SESSION['user_id'])) {
        header("Location: ../login.html");
        exit;
    }

    // Se a página exigir nível admin, verifica a role setada no login admin
    if ($perfilNecessario === 'admin') {
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            header("Location: ../adm/painelAdm.html");
            exit;
        }
    }
}