const socket = io();
const peers = {};
let localStream;

// Mikrofon akışını başlat
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {
        localStream = stream;
    })
    .catch((err) => console.error('Mikrofon hatası:', err));

// Odaya katıl
function joinRoom(room) {
    socket.emit('join', room);
    console.log(`${room} odasına katıldınız.`);
}

// Yeni kullanıcı bağlandığında Peer oluştur
socket.on('user-joined', (id) => {
    const peerConnection = new RTCPeerConnection();
    peers[id] = peerConnection;

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.play();
        document.body.appendChild(audioElement);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { target: id, signal: event.candidate });
        }
    };

    peerConnection.createOffer().then((offer) => {
        peerConnection.setLocalDescription(offer);
        socket.emit('signal', { target: id, signal: offer });
    });

    // Kullanıcı listesini güncelle
    const usersList = document.getElementById('users');
    const userItem = document.createElement('li');
    userItem.id = id;
    userItem.textContent = `Kullanıcı: ${id}`;
    usersList.appendChild(userItem);
});

// Sinyal iletişimi
socket.on('signal', (data) => {
    const peerConnection = peers[data.caller] || new RTCPeerConnection();
    peers[data.caller] = peerConnection;

    peerConnection.ontrack = (event) => {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.play();
        document.body.appendChild(audioElement);
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { target: data.caller, signal: event.candidate });
        }
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal))
        .then(() => {
            if (data.signal.type === 'offer') {
                peerConnection.createAnswer().then((answer) => {
                    peerConnection.setLocalDescription(answer);
                    socket.emit('signal', { target: data.caller, signal: answer });
                });
            }
        });
});

// Kullanıcı ayrıldığında
socket.on('user-disconnected', (id) => {
    const userItem = document.getElementById(id);
    if (userItem) userItem.remove();

    if (peers[id]) {
        peers[id].close();
        delete peers[id];
    }
});

// Ekran paylaşımı
function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
            const screenTrack = stream.getTracks()[0];
            for (const id in peers) {
                const peer = peers[id];
                const sender = peer.getSenders().find((s) => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            }
            screenTrack.onended = () => {
                for (const id in peers) {
                    const peer = peers[id];
                    const sender = peer.getSenders().find((s) => s.track.kind === 'video');
                    if (sender) sender.replaceTrack(localStream.getVideoTracks()[0]);
                }
            };
        })
        .catch((err) => console.error('Ekran paylaşımı hatası:', err));
}
