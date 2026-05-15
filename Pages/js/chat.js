// Seletores Corrigidos
const chatBody  = document.getElementById('messages');
const userInput = document.getElementById('input');
const sendBtn   = document.getElementById('sendBtn');
const chatBox   = document.getElementById('chatBox');

// Inicializa o horário da primeira mensagem
if(document.getElementById('initTime')) {
    document.getElementById('initTime').textContent = getTime();
}

function toggleChat() {
    chatBox.classList.toggle('active');
    if (chatBox.classList.contains('active')) {
        userInput.focus();
    }
}

function getTime() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function addMsg(text, who) {
    const div = document.createElement('div');
    // 'who' deve ser 'user' ou 'bot' para bater com seu CSS
    div.className = 'msg ' + who;
    div.innerHTML = escapeHtml(text) + `<div class="msg-time">${getTime()}</div>`;
    chatBody.appendChild(div);
    scrollBottom();
}

function showTyping() {
    const t = document.createElement('div');
    t.className = 'typing';
    t.id = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(t);
    scrollBottom();
}

function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
}

function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // 1. Mostra mensagem do usuário
    addMsg(text, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    // 2. Bloqueia interface
    sendBtn.disabled = true;
    showTyping();

    try {
        const formData = new FormData();
        formData.append('message', text);

        const res = await fetch('php/index.php', { 
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Erro na resposta do servidor');

        const reply = await res.text();
        removeTyping();
        addMsg(reply, 'bot');

    } catch (err) {
        removeTyping();
        addMsg('🐰 Lag detectado! Tente novamente. GG! 🚀', 'bot');
        console.error('Erro:', err);
    }

    sendBtn.disabled = false;
    userInput.focus();
}

// Event Listeners
userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});