const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// MongoDB Connection (FIXED)
mongoose.connect('mongodb://127.0.0.1:27017/collabEditor')
.then(() => console.log("MongoDB Connected Successfully"))
.catch(err => console.log("MongoDB Error:", err));

// Schema
const DocumentSchema = new mongoose.Schema({
    content: String,
    updatedAt: { type: Date, default: Date.now }
});

const Document = mongoose.model('Document', DocumentSchema);

let documentData = "";

// Load document from DB
async function loadDocument() {
    const doc = await Document.findOne();
    if (doc) documentData = doc.content;
}
loadDocument();

io.on('connection', (socket) => {
    console.log("User connected");

    socket.emit("load", documentData);

    socket.on("edit", async (data) => {
        documentData = data;

        await Document.findOneAndUpdate(
            {},
            { content: data, updatedAt: new Date() },
            { upsert: true }
        );

        socket.broadcast.emit("update", data);
    });

    socket.on('disconnect', () => {
        console.log("User disconnected");
    });
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
