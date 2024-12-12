const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // Odadaki kullanıcıları tutmak için

app.use(express.static('public'));

// Socket.io bağlantısı
io.on('connection', (socket) => {
    console.log(`Kullanıcı bağlandı: ${socket.id}`);

    // Kullanıcı odaya katıldığında
    socket.on('join-room', (roomName) => {
        socket.join(roomName);
        if (!rooms[roomName]) rooms[roomName] = [];
        rooms[roomName].push(socket.id);

        // Oda katılımını diğer kullanıcılara yayınla
        io.to(roomName).emit('user-joined', rooms[roomName]);

        console.log(`Kullanıcı ${socket.id}, ${roomName} odasına katıldı`);
    });

    // Mesaj gönderildiğinde
    socket.on('message', ({ roomName, message }) => {
        io.to(roomName).emit('message', { user: socket.id, text: message });
    });

    // Kullanıcı bağlantıyı kopardığında
    socket.on('disconnect', () => {
        for (const roomName in rooms) {
            rooms[roomName] = rooms[roomName].filter((id) => id !== socket.id);
            io.to(roomName).emit('user-left', rooms[roomName]);
        }
        console.log(`Kullanıcı ayrıldı: ${socket.id}`);
    });
});

server.listen(10000, () => {
    console.log('Sunucu 10000 portunda çalışıyor');
});
