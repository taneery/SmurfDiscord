const socket = io();

let localStream = null;
let peerConnection = null;
let screenStream = null;
let configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function startAudio() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('Mikrofon akışı başlatıldı.');
    } catch (err) {
        console.error('Mikrofon izni alınamadı:', err);
        alert('Lütfen mikrofon izni verin.');
    }
}

function startCall(roomName) {
    peerConnection = new RTCPeerConnection(configuration);

    if (localStream) {
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { roomName, candidate: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        const remoteAudio = document.getElementById('remote-audio');
        if (remoteAudio.srcObject !== event.streams[0]) {
            remoteAudio.srcObject = event.streams[0];
            console.log('Uzak ses akışı bağlandı.');
        }
    };

    peerConnection.createOffer()
        .then((offer) => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', { roomName, offer: peerConnection.localDescription });
        });
}

async function startScreenShare() {
    try {
        // Ekran paylaşımını al
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];

        // Peer bağlantısına ekran paylaşımı videosunu ekle
        if (peerConnection) {
            peerConnection.addTrack(videoTrack, screenStream);
        }

        const videoElement = document.getElementById('shared-screen');
        videoElement.srcObject = screenStream;

        // Ekran paylaşımını diğer tarafa gönder
        socket.emit('screen-share', screenStream);

        videoTrack.onended = () => {
            videoElement.srcObject = null;
            console.log('Ekran paylaşımı durduruldu.');
        };
    } catch (err) {
        console.error('Ekran paylaşımı başlatılamadı:', err);
    }
}

socket.on('offer', ({ roomName, offer }) => {
    if (!peerConnection) startCall(roomName);

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => {
            socket.emit('answer', { roomName, answer: peerConnection.localDescription });
        });
});

socket.on('answer', ({ answer }) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Chat mesajlarını göster
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value;
    socket.emit('message', message);
    input.value = '';
}

// Gelen chat mesajlarını ekrana yaz
socket.on('message', (message) => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div>${message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Kullanıcı listesini al
socket.on('user-list', (users) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach((user) => {
        userList.innerHTML += `<li>${user}</li>`;
    });
});

// Ekran paylaşımını karşıya aktar
socket.on('screen-share', (stream) => {
    const videoElement = document.getElementById('shared-screen');
    videoElement.srcObject = stream;
});
