const Message = require("../models/Message")
const socketIO = require("socket.io")

let onlineUsers = []

const editorUsers = {}

const setupSocket = (server) => {

    const io = socketIO(server, {

        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }

    })

    io.on("connection", (socket) => {

        console.log(
            "User Connected:",
            socket.id
        )
     socket.on("mark_seen", async ({ room, username }) => {

    try {

        await Message.updateMany(
            {
                room: room,
                author: { $ne: username }
            },
            {
                $set: {
                    seen: true
                }
            }
        )

        const updatedMessages =
    await Message.find({
        room
    })

io.to(room).emit(
    "message_seen_update",
    updatedMessages
)

    } catch (error) {

        console.log(error)

    }

})

// send note
socket.on(
    "send_note",
    (data) => {

        socket.to(data.room).emit(
            "receive_note",
            data.note
        )

    }
)
// darwing
socket.on(
    "send_drawing",
    (data) => {

        socket.to(data.room).emit(
            "receive_drawing",
            data.drawing
        )

    }
)

        // JOIN ROOM
        socket.on(
            "join_room",
            (data) => {

                if (!data.username || !data.room) {
                    return
                }

                const alreadyJoined =
                    onlineUsers.some(
                        (user) =>
                            user.socketId === socket.id &&
                            user.username === data.username &&
                            user.room === data.room
                    )

                socket.join(data.room)

                // REMOVE OLD USER
                onlineUsers = onlineUsers.filter(
                    (user) =>
                        user.socketId !== socket.id
                )

                // REMOVE SAME USER FROM SAME ROOM
onlineUsers = onlineUsers.filter(
    (user) =>
        !(
            user.username === data.username &&
            user.room === data.room
        )
)

// ADD USER
onlineUsers = onlineUsers.filter(
    (user) =>
        !(
            user.username === data.username &&
            user.room === data.room
        )
)

onlineUsers.push({
    socketId: socket.id,
    username: data.username,
    room: data.room
})

                // ROOM USERS
                const roomUsers =
                    onlineUsers.filter(
                        (user) =>
                            user.room === data.room
                    )

                // SEND ONLINE USERS
                io.to(data.room).emit(
                    "online_users",
                    roomUsers
                )

                console.log(
                    `${data.username} joined ${data.room}`
                )
                if (!alreadyJoined) {
                io.to(data.room).emit(
    "user_joined",
    `${data.username} joined ${data.room} 🚀`
)
                }

            }
        )

        // SEND MESSAGE
        socket.on(
            "send_message",
            async (data) => {

                try {

                    const newMessage =
                        new Message({

                            room: data.room,

                            author: data.author,

                            message:
                                data.message || "",

                            image:
                                data.image || "",

                            fileName:
                                data.fileName || "",

                            replyTo:
                                data.replyTo || null,

                            reactions: {}

                        })

                    const savedMessage =
                        await newMessage.save()

                    // SEND TO ROOM
                    io.to(data.room).emit(
                        "receive_message",
                        savedMessage
                    )

                } catch (error) {

                    console.log(error)

                }

            }
        )

        // MESSAGE REACTION
        socket.on(
            "message_reaction",
            async (data) => {

                try {

                    const message =
                        await Message.findById(
                            data.messageId
                        )

                    if (!message) return

                    if (!message.reactions) {

                        message.reactions = {}

                    }

                    // ADD REACTION
                    if (
                        message.reactions[
                            data.emoji
                        ]
                    ) {

                        message.reactions[
                            data.emoji
                        ] += 1

                    } else {

                        message.reactions[
                            data.emoji
                        ] = 1

                    }

                    // IMPORTANT
                    message.markModified(
                        "reactions"
                    )

                    await message.save()

                    // SEND UPDATED REACTION
                    io.to(data.room).emit(
                        "reaction_updated",
                        {

                            messageId:
                                data.messageId,

                            reactions:
                                message.reactions

                        }
                    )

                } catch (error) {

                    console.log(error)

                }

            }
        )

       // DELETE MESSAGE
socket.on(
    "delete_message",
    async (data) => {

        try {

            await Message.findByIdAndDelete(
                data.messageId
            )

            io.to(data.room).emit(
                "message_deleted",
                data.messageId
            )

        } catch (error) {

            console.log(error)

        }

    }
)
        socket.on(
            "typing",
            (data) => {

                socket.to(data.room).emit(
    "show_typing",
    data.username
)

            }
        )

        // STOP TYPING
        socket.on(
            "stop_typing",
            (room) => {

                socket.to(room).emit(
                    "show_typing",
                    ""
                )

            }
        )
        socket.on(
    "editor_focus",
    (data) => {

        io.to(data.room).emit(
            "editor_focus_receive",
            data.username
        )

    }
)
        socket.on(
    "editor_typing",
    (data) => {

        socket
            .to(data.room)
            .emit(
                "editor_typing_receive",
                data.username
            )

    }
)
        socket.on(
    "editor_join",
    ({ room, username }) => {

        socket.username = username
        socket.editorRoom = room

        socket.join(room)

        if (!editorUsers[room]) {

            editorUsers[room] = []

        }
       editorUsers[room] =
    editorUsers[room].filter(
        (user) => user !== username
    )

editorUsers[room].push(username)

console.log(
    "EDITOR USERS:",
    room,
    editorUsers[room]
)

io.to(room).emit(
    "editor_users",
    editorUsers[room]
)

    }
)
        // COLLABORATIVE EDITOR

socket.on("editor_update", (data) => {

    socket.to(data.room).emit(
        "editor_receive",
        data.content
    )

})

// VIDEO CALL JOIN
socket.on(
    "join_video_room",
    ({ room, peerId, username }) => {

        socket.join(room)

        socket.to(room).emit(
            "user_video_joined",
            {
                peerId,
                username
            }
        )

    }
)

socket.on("call-user", (data) => {

    io.to(data.target).emit(
        "incoming-call",
        {
            offer: data.offer,
            caller: socket.id
        }
    )

})

socket.on("answer-call", (data) => {

    io.to(data.target).emit(
        "call-answered",
        {
            answer: data.answer
        }
    )

})

socket.on("ice-candidate", (data) => {

    io.to(data.target).emit(
        "ice-candidate",
        data.candidate
    )

})

socket.on(
    "webrtc_offer",
    (data) => {

        socket.to(data.room).emit(
            "webrtc_offer",
            data.offer
        )

    }
)

socket.on(
    "webrtc_answer",
    (data) => {

        socket.to(data.room).emit(
            "webrtc_answer",
            data.answer
        )

    }
)

socket.on(
    "ice_candidate",
    (data) => {

        socket.to(data.room).emit(
            "ice_candidate",
            data.candidate
        )

    }
)

socket.on("video_call_request", (data) => {

    socket.to(data.room).emit(
        "incoming_video_call",
        {
            caller: data.username
        }
    )

})

socket.on("video_call_accept", (data) => {

    socket.to(data.room).emit(
        "video_call_accepted",
        {
            username: data.username
        }
    )

})

socket.on("video_call_reject", (data) => {

    socket.to(data.room).emit(
        "video_call_rejected"
    )

})

socket.on("call_user", (data) => {

    socket.to(data.room).emit(
        "incoming_call",
        {
            caller: data.username
        }
    )

})

socket.on("call_accepted", (data) => {

    socket.to(data.room).emit(
        "call_joined",
        {
            username: data.username
        }
    )

})

socket.on("end_call", (room) => {

    io.to(room).emit(
        "call_ended"
    )

})

       // DISCONNECT
socket.on(
    "disconnect",
    () => {
        Object.keys(editorUsers).forEach(
    (room) => {

        editorUsers[room] =
            editorUsers[room].filter(
                (user) =>
                    user !==
                    socket.username
            )
            io.to(room).emit(
    "editor_left",
    `${socket.username} left the editor 👋`
)

        io.to(room).emit(
            "editor_users",
            editorUsers[room]
        )

    }
)

        // FIND USER
        const disconnectedUser =
            onlineUsers.find(
                (user) =>
                    user.socketId === socket.id
            )

        // REMOVE USER
        onlineUsers = onlineUsers.filter(
            (user) =>
                user.socketId !== socket.id
        )

        // UPDATE ROOM USERS
        if (disconnectedUser) {

            const roomUsers =
                onlineUsers.filter(
                    (user) =>
                        user.room === disconnectedUser.room
                )

            // UPDATE ONLINE USERS
            io.to(
                disconnectedUser.room
            ).emit(
                "online_users",
                roomUsers
            )

            // USER LEFT MESSAGE
            io.to(
                disconnectedUser.room
            ).emit(
                "user_left",
                `${disconnectedUser.username} left the room 👋`
            )

            // OFFLINE USER
            io.emit(
                "offline_user",
                disconnectedUser.username
            )

        }

        // SEND UPDATED ONLINE USERS
        io.emit(
            "online_users",
            onlineUsers
        )

        console.log(
            "User Disconnected:",
            socket.id
        )

    }
)

    })

}

module.exports = setupSocket
