const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let users = [];

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı:', socket.id);
    users.push(socket.id);

    io.emit('user-list', users);

    socket.on('message', (message) => {
        socket.broadcast.emit('message', message);
    });

    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.broadcast.emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.broadcast.emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        users = users.filter((id) => id !== socket.id);
        io.emit('user-list', users);
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

server.listen(10000, () => {
    console.log('Sunucu 10000 portunda çalışıyor');
});
