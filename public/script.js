const socket = io();
let currentRoom = null;

// Odaya katıl
function joinRoom(roomName) {
    currentRoom = roomName;
    socket.emit('join-room', roomName);
}

// Mesaj gönder
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    if (!message.trim() || !currentRoom) return;

    socket.emit('message', { roomName: currentRoom, message });
    input.value = '';
}

// Mesajları al ve göster
socket.on('message', ({ user, text }) => {
    displayMessage(user, text);
});

function displayMessage(user, text) {
    const list = document.getElementById('message-list');
    const item = document.createElement('li');
    item.textContent = `${user}: ${text}`;
    list.appendChild(item);
}

// Odadaki kullanıcıları listele
socket.on('user-joined', (users) => {
    const list = document.getElementById('participants-list');
    list.innerHTML = ''; // Mevcut listeyi temizle
    users.forEach((id) => {
        const item = document.createElement('li');
        item.textContent = `Kullanıcı: ${id}`;
        list.appendChild(item);
    });
});

socket.on('user-left', (users) => {
    const list = document.getElementById('participants-list');
    list.innerHTML = ''; // Listeyi tekrar güncelle
    users.forEach((id) => {
        const item = document.createElement('li');
        item.textContent = `Kullanıcı: ${id}`;
        list.appendChild(item);
    });
});
