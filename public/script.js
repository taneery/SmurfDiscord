const socket = io();
const peers = {};
let localStream;

// Mikrofon akışını başlat
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {
        localStream = stream;
    })
    .catch((err) => console.error('Mikrofon hatası:', err));

// Kullanıcı listesini güncel tut
socket.on('user-joined', (id) => {
    const list = document.getElementById('participants-list');
    const item = document.createElement('li');
    item.id = `user-${id}`;
    item.textContent = `Kullanıcı: ${id}`;
    list.appendChild(item);
});

socket.on('user-disconnected', (id) => {
    const item = document.getElementById(`user-${id}`);
    if (item) item.remove();
});

// Yazılı chat
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    if (!message.trim()) return;

    socket.emit('message', message);
    input.value = '';
    displayMessage('Ben', message);
}

socket.on('message', ({ user, text }) => {
    displayMessage(user, text);
});

function displayMessage(user, text) {
    const list = document.getElementById('message-list');
    const item = document.createElement('li');
    item.textContent = `${user}: ${text}`;
    list.appendChild(item);
}

// Ekran paylaşımı
function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then((stream) => {
            const video = document.getElementById('shared-screen');
            const status = document.getElementById('screen-status');
            video.srcObject = stream;
            status.style.display = 'none';
            video.style.display = 'block';

            stream.getVideoTracks()[0].onended = () => {
                status.style.display = 'block';
                video.style.display = 'none';
            };
        })
        .catch((err) => console.error('Ekran paylaşımı hatası:', err));
}
