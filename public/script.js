const socket = io();
let localStream;
let peerConnections = {};

function joinAudio(room) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            localStream = stream;
            socket.emit('join', room);

            stream.getTracks().forEach(track => {
                console.log(`Room ${room}: Bağlanıldı.`);
            });
        })
        .catch(err => console.error('Mikrofon hatası:', err));
}

function leaveAudio(room) {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        console.log(`Room ${room}: Ayrılındı.`);
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    if (message) {
        socket.emit('message', message);
        addMessage(`Sen: ${message}`);
        input.value = '';
    }
}

function addMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const msg = document.createElement('div');
    msg.textContent = message;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

socket.on('message', (message) => {
    addMessage(`Arkadaş: ${message}`);
});
