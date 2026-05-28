import { useState, useEffect, useRef, useCallback } from "react"
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import notificationSound from "../sounds/notification.mp3"
import { FaImage } from "react-icons/fa"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { toast } from "react-toastify"
import TiptapEditor from "../components/TiptapEditor"
import VideoCall from "../components/VideoCall"


import Whiteboard from "../components/Whiteboard"

const socket = io("http://localhost:5000")

export default function Dashboard() {

    const navigate = useNavigate()

    const messagesEndRef = useRef(null)

    const [room, setRoom] = useState("")
    const [username, setUsername] = useState(

    sessionStorage.getItem("username") || ""

)
    const [message, setMessage] = useState("")
    const [messageList, setMessageList] = useState([])
    const [typingUser, setTypingUser] = useState("")
    const [onlineUsers, setOnlineUsers] = useState([])
    const [searchRoom, setSearchRoom] = useState("")

    const [rooms, setRooms] = useState([])
    const [newRoom, setNewRoom] = useState("")
    const [loading, setLoading] = useState(false)

    const [selectedFile, setSelectedFile] = useState(null)

    const [replyMessage, setReplyMessage] = useState(null)
    const [avatar, setAvatar] =
useState("")
const [isRecording, setIsRecording] =
useState(false)

const [mediaRecorder, setMediaRecorder] =
useState(null)

const [, setAudioChunks] =
useState([])
const [notification, setNotification] =
useState("")
const [unreadMessages, setUnreadMessages] =
useState({})
const [unreadCount, setUnreadCount] =
useState(0)
const [searchMessage, setSearchMessage] = useState("")
const [offlineUsers, setOfflineUsers] =
useState([])

    // AUTO SCROLL
    const scrollToBottom = useCallback(() => {

        messagesEndRef.current?.scrollIntoView({
           behavior:
messageList.length > 5
    ? "smooth"
    : "auto"
        })

    }, [messageList.length])

    const fetchRooms = useCallback(async () => {

        try {

            const response = await axios.get(
                "http://localhost:5000/api/rooms"
            )

            setRooms(response.data)

        } catch (error) {

            console.log(error)

        }

    }, [])
    

    useEffect(() => {

        scrollToBottom()

    }, [messageList, scrollToBottom])

    // FETCH ROOMS
    useEffect(() => {

        const loadRooms = async () => {

            try {

                const response = await axios.get(
                    "http://localhost:5000/api/rooms"
                )

                setRooms(response.data)

            } catch (error) {

                console.log(error)

            }

        }

        loadRooms()

    }, [])

    useEffect(() => {

        if ("Notification" in window) {

            Notification.requestPermission()

        }

    }, [])

    // CREATE ROOM
    const createRoom = async () => {

        if (newRoom === "" || username === "") return

        try {

            setLoading(true)

            await axios.post(
                "http://localhost:5000/api/rooms/create",
                {
                    roomName: newRoom,
                    createdBy: username
                }
            )

            fetchRooms()

            setNewRoom("")

            alert("Room Created Successfully")

        } catch (error) {

            console.log(error)

            alert("Room already exists")

        } finally {

            setLoading(false)

        }

    }

    // DELETE ROOM
    const deleteRoom = async (id) => {

        try {

            await axios.delete(
                `http://localhost:5000/api/rooms/${id}`
            )

            fetchRooms()

        } catch (error) {

            console.log(error)

        }

    }

   // JOIN ROOM
const joinRoom = async (selectedRoom = room) => {

    // PREVENT JOINING SAME ROOM AGAIN
    if (
        selectedRoom === room &&
        room !== ""
    ) {
        return
    }

    if (
        selectedRoom !== "" &&
        username !== ""
    ) {

        setRoom(selectedRoom)

        // CLEAR OLD MESSAGES
        setMessageList([])

        socket.emit("join_room", {
            room: selectedRoom,
            username
        })

        try {

            const response = await axios.get(
                `http://localhost:5000/messages/${selectedRoom}`
            )

            setMessageList(response.data)

            // MARK MESSAGES AS SEEN
            socket.emit("mark_seen", {
                room: selectedRoom,
                username
            })

            // RESET UNREAD COUNT
            setUnreadMessages((prev) => ({
                ...prev,
                [selectedRoom]: 0
            }))

            setUnreadCount(0)

            alert(`Joined Room: ${selectedRoom}`)

        } catch (error) {

            console.log(
                "Room join error:",
                error
            )

        }

    }

}
    // SEND MESSAGE
    const sendMessage = () => {

        if (
            message === "" &&
            !replyMessage
        ) return

        if (room === "") return

        const messageData = {

            room,
            author: username,
            message,
            createdAt: new Date(),

            replyTo: replyMessage
                ? {
                    author: replyMessage.author,
                    message: replyMessage.message
                }
                : null

        }

        socket.emit(
            "send_message",
            messageData
        )

        setMessage("")

        setReplyMessage(null)

    }

    // ENTER KEY
    const handleKeyPress = (e) => {

        if (e.key === "Enter") {

            sendMessage()

        }

    }

    // FILE UPLOAD
  const uploadFile = async (customFile = null) => {

    const file =
        customFile || selectedFile

    if (!file || !room) return

    const formData = new FormData()

    formData.append(
        "file",
        file
    )

    try {

        const response = await axios.post(
            "http://localhost:5000/upload",
            formData
        )

        const fileData = {

            room,
            author: username,
            message: "",
            image: response.data.fileUrl,
            fileName: file.name,
            createdAt: new Date()

        }

        socket.emit(
            "send_message",
            fileData
        )

        setSelectedFile(null)

    } catch (error) {

        console.log(error)

    }

}
   // DELETE MESSAGE
const deleteMessage = async (id) => {

    try {

        await axios.delete(
            `http://localhost:5000/messages/${id}`
        )

        socket.emit(
            "delete_message",
            {
                messageId: id,
                room
            }
        )

    } catch (error) {

        console.log(error)

    }

}
    // EDIT MESSAGE
    const editMessage = async (
        id,
        oldMessage
    ) => {

        const updatedText = prompt(
    "Edit your message",
    oldMessage || ""
)

if (updatedText === null) return

        try {

            const response = await axios.put(
                `http://localhost:5000/messages/${id}`,
                {
                    message: updatedText
                }
            )

            setMessageList((prev) =>
                prev.map((msg) =>
                    msg._id === id
                        ? response.data
                        : msg
                )
            )

        } catch (error) {

            console.log(error)

        }

    }

    // REACTION
    const reactToMessage = (
        messageId,
        emoji
    ) => {

        socket.emit(
            "message_reaction",
            {
                messageId,
                emoji,
                room
            }
        )

    }

    // LOGOUT
    const handleLogout = () => {

        socket.disconnect()
        sessionStorage.clear()

        localStorage.removeItem("token")
        sessionStorage.removeItem("username")

        navigate("/")

        window.location.reload()

    }

    // SOCKET EVENTS
    useEffect(() => {

        socket.off("user_joined")

        socket.on(
            "user_joined",
            (msg) => {

                console.log(
                    "JOIN EVENT RECEIVED"
                )

                toast.success(
                    msg,
                    {
                        toastId: msg
                    }
                )

                setNotification(msg)

                setTimeout(() => {

                    setNotification("")

                }, 3000)

            }
        )

        return () => {

            socket.off("user_joined")

        }

    }, [])

    useEffect(() => {

        // RECEIVE MESSAGE
       socket.on(
    "receive_message",
    (message) => {

        setMessageList((prev) => [
            ...prev,
            message
        ])

        if (
            message.author !== username
        ) {

            toast.info(
                `\u{1F4AC} ${message.author} sent a message`
            )

            setUnreadCount((prev) =>
                prev + 1
            )

            if (
                document.hidden &&
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                new Notification(
                    "New Message",
                    {
                        body:
                            `${message.author}: ${message.message}`
                    }
                )

            }

        }

        // MARK MESSAGE AS SEEN
        if (
            message.author !== username &&
            message.room === room
        ) {

            socket.emit("mark_seen", {
                room,
                username
            })

        }

        // UNREAD COUNT
        if (
            message.room !== room
        ) {

            setUnreadMessages((prev) => ({

                ...prev,

                [message.room]:
                    (prev[message.room] || 0) + 1

            }))

        }

        const audio = new Audio(
            notificationSound
        )

        audio.play()

    }
)
        // DELETE MESSAGE
        socket.on(
            "message_deleted",
            (id) => {

                setMessageList((prev) =>
                    prev.filter(
                        (msg) => msg._id !== id
                    )
                )

            }
        )

        // REACTION UPDATE
        socket.on(
            "reaction_updated",
            (data) => {

                setMessageList((prev) =>

                    prev.map((msg) =>

                        msg._id === data.messageId

                            ? {
                                ...msg,
                                reactions: data.reactions
                            }

                            : msg
                    )

                )

            }
        )
       socket.on(
    "message_seen_update",
    async () => {

        try {

            const response =
                await axios.get(
                    `http://localhost:5000/messages/${room}`
                )

            setMessageList(
                response.data
            )

        } catch (error) {

            console.log(error)

        }

    }
)


        // TYPING
      socket.on(
    "show_typing",
    (data) => {

        setTypingUser(data)

        setTimeout(() => {

            setTypingUser("")

        }, 1000)

    }
)
socket.on(
    "user_left",
    (msg) => {

        toast.warning(msg)

        setNotification(msg)

        setTimeout(() => {

            setNotification("")

        }, 3000)

    }
)

socket.on(
    "offline_user",
    (username) => {

       setOfflineUsers((prev) => {

    if (prev.includes(username)) {

        return prev

    }

    return [

        ...prev,

        username

    ]

})

    }
)

        // ONLINE USERS
       socket.on(
    "online_users",
    (users) => {

        setOnlineUsers(users)

        setOfflineUsers((prev) =>

            prev.filter(
                (offlineUser) =>

                    !users.some(
                        (onlineUser) =>

                            onlineUser.username === offlineUser
                    )
            )

        )

    }
)
       return () => {

    socket.off("receive_message")

    socket.off("message_deleted")

    socket.off("reaction_updated")

    socket.off("show_typing")

    socket.off("online_users")

    socket.off("message_seen_update")

    socket.off("user_left")
    socket.off("offline_user")

}
    }, [room, username])
    
    

    const uploadAvatar = async (e) => {

    const file = e.target.files[0]

    if (!file) return

    const formData = new FormData()

    formData.append(
        "file",
        file
    )

    try {

        const response =
            await axios.post(
                "http://localhost:5000/upload-avatar",
                formData
            )

        setAvatar(
            response.data.avatarUrl
        )

        sessionStorage.setItem(
    `avatar_${username}`,
    response.data.avatarUrl
)

        alert(
            "Avatar Updated 🚀"
        )

    } catch (error) {

        console.log(error)

    }

}
const startRecording = async () => {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
                
            })
            

        const recorder =
            new MediaRecorder(stream)

        setMediaRecorder(recorder)

        recorder.start()

        setIsRecording(true)

        const chunks = []

        recorder.ondataavailable = (e) => {

            chunks.push(e.data)

        }

        recorder.onstop = async () => {

            const audioBlob =
    new Blob(chunks, {
        type: "audio/webm"
    })

            const audioFile =
               new File(
    [audioBlob],
    "voice-message.webm"
)

            uploadFile(audioFile)

            setAudioChunks([])

        }

    } catch (error) {

        console.log(error)

    }

}
const stopRecording = () => {

    if (mediaRecorder) {

        mediaRecorder.stop()

        setIsRecording(false)
        setMediaRecorder(null)
        setAudioChunks([])
        

    }

}

return (

    
        
        
        <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">

            {/* HEADER */}

            <div className="flex justify-between items-center mb-10">

                <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
                    Collaboration Dashboard
                </h1>

                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl"
                >
                    Logout
                </button>

            </div>

            <div className="grid lg:grid-cols-4 gap-6">

                {/* SIDEBAR */}

                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700">

                    <h2 className="text-2xl font-bold mb-6">
                        Workspace
                    </h2>

                    <div className="flex items-center gap-4 mb-6">

    {
        avatar ? (

            <img
                src={avatar}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-pink-500"
            />

        ) : (

            <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center text-2xl font-bold">

                {username?.charAt(0).toUpperCase()}

            </div>

        )
    }

    <div className="flex-1">

        <input
            type="text"
            placeholder="Enter Your Name"
            value={username}
           onChange={(e) => {

    const value = e.target.value

    setUsername(value)
    sessionStorage.setItem(
    "username",
    value
)

    const savedAvatar =
        sessionStorage.getItem(
            `avatar_${value}`
        )

    if (savedAvatar) {

        setAvatar(savedAvatar)

    } else {

        setAvatar("")

    }

}}
            className="w-full p-3 rounded-2xl bg-slate-800 outline-none"
        />

        <label className="text-pink-400 text-sm cursor-pointer mt-2 inline-block">

            Upload Avatar

            <input
                type="file"
                hidden
                onChange={uploadAvatar}
            />

        </label>

    </div>

</div>

                    {/* CREATE ROOM */}

                    <div className="flex flex-col gap-3 mb-6">

                        <input
                            type="text"
                            placeholder="Create New Room"
                            value={newRoom}
                            onChange={(e) =>
                                setNewRoom(e.target.value)
                            }
                            className="w-full p-4 rounded-2xl bg-slate-800 outline-none"
                        />

                        <button
                            onClick={createRoom}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 py-3 rounded-2xl"
                        >

                            {
                                loading
                                    ? "Creating..."
                                    : "Create Room"
                            }

                        </button>

                    </div>

                    {/* ROOMS */}

                    <div className="bg-slate-800 p-5 rounded-2xl mb-6">

                        <h3 className="text-xl font-bold mb-4">
                            Available Rooms
                        </h3>

                        <input
                            type="text"
                            placeholder="Search Room"
                            value={searchRoom}
                            onChange={(e) =>
                                setSearchRoom(e.target.value)
                            }
                            className="w-full p-3 rounded-xl bg-slate-700 outline-none mb-4"
                        />

                        <div className="flex flex-col gap-3">

                            {
                                rooms
                                    .filter((roomItem) =>
                                        roomItem.roomName
                                            .toLowerCase()
                                            .includes(
                                                searchRoom.toLowerCase()
                                            )
                                    )
                                    .map((roomItem) => (

                                        <div
                                            key={roomItem._id}
                                            className={`flex justify-between items-center p-3 rounded-xl ${
                                                room === roomItem.roomName
                                                    ? "bg-blue-600"
                                                    : "bg-slate-700"
                                            }`}
                                        >

                                            <button
                                                onClick={() =>
                                                    joinRoom(
                                                        roomItem.roomName
                                                    )
                                                }
                                                className="flex-1 text-left"
                                            >
                                                <div className="flex items-center justify-between w-full">

    <span>
        #{roomItem.roomName}
    </span>

    {
        unreadMessages[
            roomItem.roomName
        ] > 0 && (

            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">

                {
                    unreadMessages[
                        roomItem.roomName
                    ]
                }

            </span>

        )
    }

</div>
                                            </button>

                                            <button
                                                onClick={() =>
                                                    deleteRoom(
                                                        roomItem._id
                                                    )
                                                }
                                            >
                                                ❌
                                            </button>

                                        </div>

                                    ))
                            }

                        </div>

                    </div>

                    {/* ONLINE USERS */}

                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">

                        <h3 className="text-xl font-bold mb-4">
                            Online Users
                        </h3>

                        <div className="flex flex-col gap-3">

                            {
                                onlineUsers.map((user, index) => (

                                    <div
                                        key={index}
                                        className="bg-green-600 px-4 py-3 rounded-xl"
                                    >
                                       <div className="flex items-center justify-between">

    <span>
        {user.username}
    </span>

    <span className="text-green-300 text-sm">
        🟢 Online
    </span>

</div>
</div>
                                    

))
}

</div>

</div>
                    {/* OFFLINE USERS */}

{
    offlineUsers.length > 0 && (

        <div className="mt-6 bg-slate-800 p-5 rounded-2xl">

            <h3 className="text-xl font-bold mb-4">
                Offline Users
            </h3>

            <div className="flex flex-col gap-3">

                {
                    offlineUsers.map(
                        (user, index) => (

                            <div
                                key={index}
                                className="bg-slate-700 px-4 py-3 rounded-xl flex justify-between"
                            >

                                <span>
                                    {user}
                                </span>

                                <span className="text-red-400 text-sm">
                                    🔴 Offline
                                </span>

                            </div>

                        )
                    )
                }

            </div>

        </div>

    )
}

                </div>
                {
    notification && (

        <div className="fixed top-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce">

            {notification}

        </div>

    )
}

                {/* CHAT */}

                <div className="lg:col-span-3 bg-slate-900 p-8 rounded-3xl">

                    <h2 className="text-3xl font-bold mb-6">
                        Real-Time Chat {room && `- #${room}`}
                    </h2>

                    {/* REPLY */}

                    {
                        replyMessage && (

                            <div className="bg-slate-800 border-l-4 border-blue-500 p-4 rounded-2xl mb-4">

                                <p className="text-sm text-blue-400 font-semibold">
                                    Replying to {replyMessage.author}
                                </p>

                                <p className="text-slate-300 text-sm mt-1">
                                    {replyMessage.message}
                                </p>

                                <button
                                    onClick={() =>
                                        setReplyMessage(null)
                                    }
                                    className="text-red-400 text-xs mt-2"
                                >
                                    Cancel Reply
                                </button>

                            </div>

                        )
                    }

                    {/* MESSAGE INPUT */}

                    <div className="flex gap-4 mb-4">

                        <input
                            type="text"
                            placeholder="Enter Message"
                            value={message}
                            onChange={(e) => {

                                setMessage(e.target.value)

                                socket.emit("typing", {
                                    room,
                                    username
                                })

                                setTimeout(() => {

                                    socket.emit(
                                        "stop_typing",
                                        room
                                    )

                                }, 1000)

                            }}
                            onKeyDown={handleKeyPress}
                            className="flex-1 p-5 rounded-2xl bg-slate-800 outline-none"
                        />

                        <button
                            onClick={sendMessage}
                            className="bg-green-600 hover:bg-green-700 px-8 rounded-2xl"
                        >
                            Send
                        </button>

                    </div>

                   {/* FILE */}

<div className="flex items-center gap-4 mb-4">

    <input
        type="file"
        id="fileInput"
        hidden
        onChange={(e) => {

            const file = e.target.files[0]

            if (file) {

                setSelectedFile(file)

            }

        }}
    />

    <button
        onClick={() =>
            document
                .getElementById("fileInput")
                .click()
        }
        className="bg-slate-700 hover:bg-slate-600 w-14 h-14 rounded-2xl flex items-center justify-center"
    >

        <FaImage className="text-2xl text-white" />

    </button>

    <button
        onClick={() => uploadFile()}
        className="bg-pink-600 hover:bg-pink-700 px-6 py-4 rounded-2xl"
    >
        Upload File
    </button>

    {
        selectedFile && (

            <p className="text-sm text-slate-300">
                {selectedFile.name}
            </p>

        )
    }

</div>
<div className="mb-4">

    {
        !isRecording ? (

            <button
                onClick={startRecording}
                className="bg-red-600 px-6 py-3 rounded-2xl"
            >
                🎤 Start Recording
            </button>

        ) : (

            <button
                onClick={stopRecording}
                className="bg-gray-700 px-6 py-3 rounded-2xl"
            >
                ⏹ Stop Recording
            </button>

        )
    }

</div>

                    {/* EMOJIS */}

                    <div className="flex gap-3 mb-4">

                        <button
                            onClick={() =>
                                setMessage(message + "😀")
                            }
                            className="bg-slate-700 px-4 py-2 rounded-xl text-2xl"
                        >
                            😀
                        </button>

                        <button
                            onClick={() =>
                                setMessage(message + "🔥")
                            }
                            className="bg-slate-700 px-4 py-2 rounded-xl text-2xl"
                        >
                            🔥
                        </button>

                        <button
                            onClick={() =>
                                setMessage(message + "🚀")
                            }
                            className="bg-slate-700 px-4 py-2 rounded-xl text-2xl"
                        >
                            🚀
                        </button>

                        <button
                            onClick={() =>
                                setMessage(message + "❤️")
                            }
                            className="bg-slate-700 px-4 py-2 rounded-xl text-2xl"
                        >
                            ❤️
                        </button>

                    </div>

                   {/* TYPING */}

{
    typingUser && (

        <div className="flex items-center gap-3 text-blue-400 mb-4">

            <span>
                💬 {typingUser} is typing
            </span>

            <div className="flex gap-1">

                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0
                    }}
                    className="w-2 h-2 bg-white rounded-full"
                />

                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0.2
                    }}
                    className="w-2 h-2 bg-white rounded-full"
                />

                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: 0.4
                    }}
                    className="w-2 h-2 bg-white rounded-full"
                />

            </div>

        </div>

    )
}

                    {/* CHAT AREA */}
                    {/* added after remmov */}
                    <TiptapEditor
    room={room}
    username={username}
/>

<Whiteboard
    room={room}
    username={username}
/>

<VideoCall
    room={room}
    username={username}
/>
                    <div
    className="bg-slate-800 p-6 rounded-2xl min-h-[450px] max-h-[450px] overflow-y-auto"

    onDragOver={(e) => {
        e.preventDefault()
    }}

    onDrop={(e) => {

        e.preventDefault()

        const file = e.dataTransfer.files[0]

        if (file) {

            setSelectedFile(file)

            uploadFile(file)

        }

    }}
>
 <input
    type="text"
    placeholder="Search Messages..."
    value={searchMessage}
    onChange={(e) =>
        setSearchMessage(e.target.value)
    }
    className="w-full p-3 rounded-xl bg-slate-700 outline-none mb-4"
/>

                        <div className="flex justify-between items-center mb-5">
                       

                            <h3 className="text-2xl font-bold">
                                Live Messages
                            </h3>

                            <span
                                className="
                                bg-blue-600
                                px-3
                                py-1
                                rounded-full
                                "
                            >
                                {unreadCount} Messages
                            </span>

                            <div className="bg-blue-600 px-4 py-2 rounded-xl">
                                {messageList.length} Messages
                            </div>

                        </div>

                        <div className="flex flex-col gap-4">

                            {
messageList.filter((msg) => {

    if (searchMessage === "") return true

    return (
        msg.message
            ?.toLowerCase()
            .includes(
                searchMessage.toLowerCase()
            ) ||

        msg.fileName
            ?.toLowerCase()
            .includes(
                searchMessage.toLowerCase()
            )
    )

})
.map((msg) => (

                                    <div
                                        key={msg._id}
                                        className={`p-4 rounded-2xl max-w-[80%] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                                            msg.author === username
                                                ? "bg-blue-600 ml-auto"
                                                : "bg-slate-700"
                                        }`}
                                    >

                                        {/* HEADER */}

                                        <div className="flex items-center gap-3">

                                 {
    sessionStorage.getItem(
        `avatar_${msg.author}`
    ) ? (

        <img
            src={
                sessionStorage.getItem(
                    `avatar_${msg.author}`
                )
            }
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
        />

    ) : (

        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold">

            {
                msg.author
                    ?.charAt(0)
                    .toUpperCase()
            }

        </div>

    )
}

                                            <div>

                                                <p className="font-bold">
                                                    {msg.author}
                                                </p>

                                                <p className="text-xs text-slate-300">

                                                    {
                                                        msg.createdAt
                                                            ? formatDistanceToNow(
    new Date(msg.createdAt),
    { addSuffix: true }
)
                                                            : ""
                                                    }

                                                </p>

                                            </div>

                                        </div>

                                        {/* REPLY */}

                                        {
                                            msg.replyTo && (

                                                <div className="bg-black/20 border-l-4 border-blue-500 p-3 rounded-xl mt-4">

                                                    <p className="text-xs text-blue-400">
                                                        {msg.replyTo.author}
                                                    </p>

                                                    <p className="text-sm text-slate-300">
                                                        {msg.replyTo.message}
                                                    </p>

                                                </div>

                                            )
                                        }
                                        

                                        {/* MESSAGE */}

                                        {
                                            msg.message && (

                                                <p className="mt-4 text-lg break-words">
                                                    {msg.message}
                                                </p>

                                            )
                                        }

                                        {/* FILE */}

                                        {
    msg.image &&
    !msg.fileName?.includes(".webm") && (

                                                <div className="mt-4">

                                                    {
                                                        msg.image.match(/\.(jpeg|jpg|png|gif|webp)$/i)

                                                            ? (

                                                                <img
                                                                    src={msg.image}
                                                                    alt="shared"
                                                                    className="rounded-2xl max-h-[300px] object-cover"
                                                                />

                                                            )

                                                            : (

                                                                <div className="bg-slate-700 p-4 rounded-2xl">

                                                                    <p>
                                                                        📁 {msg.fileName}
                                                                    </p>

                                                                </div>

                                                            )
                                                    }

                                                    <a
                                                        href={msg.image}
                                                        download
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block mt-3 text-sm text-blue-300"
                                                    >
                                                        ⬇️ Download {msg.fileName || "File"}
                                                    </a>

                                                </div>

                                            )
                                        }
                                        {
   msg.fileName?.includes(".webm") && (

        <audio
            controls
            className="mt-4 w-full"
        >
            <source
                src={msg.image}
                type="audio/webm"
            />
        </audio>

    )
}

                                        {/* ACTIONS */}

                                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">

                                            <button
                                                onClick={() => {

                                                    if (msg.message) {

                                                        navigator.clipboard.writeText(
                                                            msg.message
                                                        )

                                                    }

                                                    if (msg.image) {

                                                        navigator.clipboard.writeText(
                                                            msg.image
                                                        )

                                                    }

                                                    alert("Copied")

                                                }}
                                            >
                                                📋 Copy
                                            </button>

                                            {/* REACTIONS */}

                                            <button
                                                onClick={() =>
                                                    reactToMessage(
                                                        msg._id,
                                                        "👍"
                                                    )
                                                }
                                            >
                                                👍
                                            </button>

                                            <button
                                                onClick={() =>
                                                    reactToMessage(
                                                        msg._id,
                                                        "🔥"
                                                    )
                                                }
                                            >
                                                🔥
                                            </button>

                                            <button
                                                onClick={() =>
                                                    reactToMessage(
                                                        msg._id,
                                                        "❤️"
                                                    )
                                                }
                                            >
                                                ❤️
                                            </button>

                                            <button
                                                onClick={() =>
                                                    reactToMessage(
                                                        msg._id,
                                                        "😂"
                                                    )
                                                }
                                            >
                                                😂
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setReplyMessage(msg)
                                                }
                                            >
                                                💬 Reply
                                            </button>

                                            {
                                                msg.author === username && (

                                                    <>

                                                        <button
                                                            onClick={() =>
                                                                editMessage(
                                                                    msg._id,
                                                                    msg.message
                                                                )
                                                            }
                                                        >
                                                            ✏️ Edit
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                deleteMessage(
                                                                    msg._id
                                                                )
                                                            }
                                                        >
                                                            🗑️ Delete
                                                        </button>

                                                    </>

                                                )
                                            }

                                        </div>

                                        {/* SHOW REACTIONS */}
                                        {
    msg.author === username && (

        <p className="text-xs mt-3 text-slate-300">

            {
                msg.seen
                    ? "✓✓ Seen"
                    : "✓ Sent"
            }

        </p>

    )
}

                                        {
                                            msg.reactions &&
                                            Object.keys(msg.reactions).length > 0 && (

                                                <div className="flex gap-2 mt-3 flex-wrap">

                                                    {
                                                        Object.entries(
                                                            msg.reactions
                                                        ).map(
                                                            ([emoji, count]) => (

                                                                <div
                                                                    key={emoji}
                                                                    className="bg-slate-800 px-3 py-1 rounded-full text-sm"
                                                                >
                                                                    {emoji} {count}
                                                                </div>

                                                            )
                                                        )
                                                    }

                                                </div>

                                            )
                                        }

                                    </div>

                                ))
                            }

                            <div ref={messagesEndRef} />

                        </div>

                    </div>

                </div>

            </div>

        </div>

    )

}
