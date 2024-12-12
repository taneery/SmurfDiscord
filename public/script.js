const socket = io();
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");
const chatBox = document.getElementById("chat-box");
const startScreenShareButton = document.getElementById("start-screen-share");
const screenVideo = document.getElementById("screen-video");
const screenStatus = document.getElementById("screen-status");
const participantList = document.getElementById("participant-list");

let peerConnection = new RTCPeerConnection();
let screenStream;

// Chat mesajlarını gönder ve al
sendMessageButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("message", message);
        messageInput.value = "";
    }
});

socket.on("message", (message) => {
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
});

// Katılımcı listesini güncelle
socket.on("participants", (participants) => {
    participantList.innerHTML = "";
    participants.forEach(participant => {
        const listItem = document.createElement("li");
        listItem.textContent = participant;
        participantList.appendChild(listItem);
    });
});

// Ekran paylaşımı başlat
startScreenShareButton.addEventListener("click", () => {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
            screenStream = stream;
            const screenTrack = stream.getVideoTracks()[0];
            peerConnection.getSenders().forEach(sender => {
                if (sender.track.kind === "video") {
                    sender.replaceTrack(screenTrack);
                }
            });

            screenVideo.srcObject = stream;
            screenStatus.textContent = "Ekran Paylaşımı Aktif";
            screenStatus.style.color = "green";

            // Paylaşım durursa
            screenTrack.onended = () => {
                screenStatus.textContent = "Kapalıyız";
                screenStatus.style.color = "red";
            };
        })
        .catch(err => console.error("Ekran paylaşımı başlatılamadı:", err));
});

// Tam ekran desteği
screenVideo.addEventListener("dblclick", () => {
    if (screenVideo.requestFullscreen) {
        screenVideo.requestFullscreen();
    } else {
        console.error("Tam ekran desteklenmiyor.");
    }
});
