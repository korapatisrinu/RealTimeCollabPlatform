import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import axios from "axios"
import {
    restoreVersion,
    shareDocumentEmail
}
from "../services/documentService"


const socket = io("http://localhost:5000")


export default function TiptapEditor({
    room,
    username
}) {
    const [activeUsers, setActiveUsers] = useState([])
    const [typingUser, setTypingUser] = useState("")
    const [editorMessage, setEditorMessage] =
    useState("")
    const [currentEditor, setCurrentEditor] = useState("")
    const [lastSaved, setLastSaved] =
    useState("")
    const [versions, setVersions] =
    useState([])
    const roles = {
    nani: "Owner",
    sri: "Editor"
}
const currentRole =
    roles[username] || "Viewer"

    const editor = useEditor({
        editable:
    currentRole !== "Viewer",

        extensions: [

            StarterKit,

            Underline

        ],

        content:
`
<h2>Collaborative Notes</h2>
<p>Start writing together...</p>
`,

        onUpdate: ({ editor }) => {
            

            const content =
                editor.getHTML()

            // localStorage.setItem(
            //     "editor-content",
            //     content
            // )

            if (room) {

                console.log(
                    "EDITOR SEND:",
                    room
                )
                socket.emit(
    "editor_typing",
    {
        room,
        username
    }
)

                socket.emit(
                    "editor_update",
                    {
                        room,
                        username,
                        content
                    }
                )

            }

        },

       editorProps: {

    handleDOMEvents: {

        focus: () => {

            if (room) {

                socket.emit(
                    "editor_focus",
                    {
                        room,
                        username
                    }
                )

            }

            return false

        }

    },

    attributes: {

        class:
            "min-h-[250px] outline-none text-white p-4"

    }

}

    })

    // JOIN ROOM FOR COLLABORATION

    useEffect(() => {

    if (!room || !username) return

    socket.emit(
        "join_room",
        {
            room,
            username
        }
    )

    socket.emit(
        "editor_join",
        {
            room,
            username
        }
    )

}, [room, username])

    // AUTOSAVE

    useEffect(() => {

    if (!editor || !room) return

    const interval = setInterval(async () => {

        try {

            await axios.post(
                "http://localhost:5000/documents/save",
                {
                    room,
                    content: editor.getHTML()
                }
            )

            console.log(
    "DOCUMENT SAVED"
)

setLastSaved(
    new Date().toLocaleTimeString()
)

        } catch (error) {

            console.log(error)

        }

    }, 5000)

    return () =>
        clearInterval(interval)

}, [editor, room])

    // RECEIVE LIVE EDITOR CONTENT

    useEffect(() => {

        if (!editor) return

        const handleReceive = (content) => {

            console.log(
                "EDITOR RECEIVED"
            )

            if (
                editor.getHTML() !== content
            ) {

                editor.commands.setContent(
                    content,
                    false
                )

            }

        }

        socket.on(
            "editor_receive",
            handleReceive
        )

        return () => {

            socket.off(
                "editor_receive",
                handleReceive
            )

        }

    }, [editor])
    useEffect(() => {

    socket.on(
        "editor_users",
        (users) => {

            setActiveUsers(users)

        }
    )

    return () => {

        socket.off(
            "editor_users"
        )

    }

}, [])
     useEffect(() => {

    if (!editor || !room) return

    const loadDocument = async () => {

        try {

            const response =
                await axios.get(
                    `http://localhost:5000/documents/${room}`
                )

            if (
                response.data &&
                response.data.content
            ) {

                editor.commands.setContent(
                    response.data.content
                )

                console.log(
                    "DOCUMENT LOADED"
                )

            }

        } catch (error) {

            console.log(error)

        }

    }

    loadDocument()

axios
    .get(
        `http://localhost:5000/documents/versions/${room}`
    )
    .then((res) => {

        setVersions(res.data)

    })
    .catch(console.error)

}, [editor, room])

useEffect(() => {

    if (!editor) return

    editor.setEditable(
        currentRole !== "Viewer"
    )

}, [editor, currentRole])
useEffect(() => {

    const handleTyping = (user) => {

        if (user !== username) {

            setTypingUser(user)

            setTimeout(() => {

                setTypingUser("")

            }, 1500)

        }

    }

    socket.on(
        "editor_typing_receive",
        handleTyping
    )

    return () => {

        socket.off(
            "editor_typing_receive",
            handleTyping
        )

    }

}, [username])
useEffect(() => {

    socket.on(
        "editor_focus_receive",
        (user) => {

            setCurrentEditor(user)

        }
    )

    return () => {

        socket.off(
            "editor_focus_receive"
        )

    }

}, [])
useEffect(() => {

    socket.on(
        "editor_left",
        (message) => {

            setEditorMessage(message)

            setTimeout(() => {

                setEditorMessage("")

            }, 3000)

        }
    )

    return () => {

        socket.off("editor_left")

    }

}, [])
    const exportPDF = () => {

    window.open(
        `http://localhost:5000/documents/export/pdf/${room}`,
        "_blank"
    )

}

const exportWord = () => {

    window.open(
        `http://localhost:5000/documents/export/word/${room}`,
        "_blank"
    )

}

const handleShareEmail =
async () => {

    const email =
        prompt(
            "Enter recipient email"
        )

    if (!email) return

    try {

        await shareDocumentEmail(
            email,
            room
        )

        alert(
            "Email sent successfully"
        )

    } catch (error) {

        console.log(error)

        alert(
            "Email send failed"
        )

    }

}

    if (!editor) return null
   
    return (

        <div className="bg-slate-800 p-6 rounded-2xl mt-6">

            <h2 className="text-2xl font-bold mb-4">

                Collaborative Editor

            </h2>

            {/* TOOLBAR */}

            <div className="flex gap-2 mb-4 flex-wrap">

                <button
                    onClick={() =>
                        editor.chain().focus().toggleBold().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Bold
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Italic
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Underline
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleStrike().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Strike
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Bullet
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Ordered
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Quote
                </button>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    Code
                </button>

                <button
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 1 })
                            .run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    H1
                </button>

                <button
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                    }
                    className="bg-slate-700 px-3 py-2 rounded-lg"
                >
                    H2
                </button>

            </div>

            <div className="flex gap-2 mt-3">

                <button
                    onClick={exportPDF}
                    className="
                    bg-red-600
                    px-3
                    py-2
                    rounded
                    text-white
                    text-sm
                    "
                >
                    📄 Export PDF
                </button>

                <button
                    onClick={exportWord}
                    className="
                    bg-blue-600
                    px-3
                    py-2
                    rounded
                    text-white
                    text-sm
                    "
                >
                    📝 Export Word
                </button>

                <button
                    onClick={
                        handleShareEmail
                    }
                    className="
                    bg-green-600
                    text-white
                    px-2
                    py-1
                    rounded
                    text-xs
                    "
                >
                    📧 Share Email
                </button>

            </div>

            {/* EDITOR */}
            <div className="mb-4">
                {
    editorMessage && (

        <p className="text-red-400 mb-2">
            {editorMessage}
        </p>

    )
}

    <h3 className="text-sm text-gray-400 mb-2">

    Editing Now
    {" "}
    (
    {activeUsers.length}
    {" "}
    editors online
    )

</h3>

    {
    currentEditor && (

        <p className="text-cyan-400 text-sm mb-2">

            Currently Editing:
            {" "}
            {currentEditor}

        </p>

    )
}

    <div className="flex gap-2 flex-wrap">
       {
    typingUser &&
    typingUser !== username && (

        <p className="text-yellow-400 text-sm mt-2">
            ✍ {typingUser} is typing...
        </p>

    )
}

        {activeUsers.map((user, index) => (

            <span
                key={index}
               className={`px-3 py-1 rounded-full text-xs text-white ${
    user === "nani"
        ? "bg-green-600"

        : user === "sri"
        ? "bg-blue-600"

        : "bg-purple-600"
}`}
            >
                <div className="flex items-center gap-2">

    <div
        className="
        w-5
        h-5
        rounded-full
        bg-white
        text-black
        flex
        items-center
        justify-center
        text-[10px]
        font-bold
        "
    >
        {user.charAt(0).toUpperCase()}
    </div>
    

    <div className="flex flex-col">

    <span>
        {user}
    </span>

    <span className="text-[9px] opacity-80">

        {roles[user] || "Viewer"}

    </span>

</div>

</div>
            </span>

        ))}

    </div>
    

</div>
{
    lastSaved && (
        <p
            style={{
                color: "#22c55e",
                marginTop: "10px"
            }}
        >
            💾 Last Saved: {lastSaved}
        </p>
    )
}

<div
    style={{
        marginTop: "10px"
    }}
>

    <h4
        style={{
            color: "#22c55e"
        }}
    >
        🕘 Document Version History
    </h4>

    <div
        style={{
            maxHeight: "120px",
            overflowY: "auto",
            paddingRight: "5px",
            
        }}
    >

      {versions
    .slice()
    .reverse()
    .slice(0, 10)
    .map((version) => (

        <div
            key={version._id}
            className="
            flex
            justify-between
            items-center
            mb-1
            "
        >

            <span
                style={{
                    color: "#94a3b8",
                    fontSize: "13px"
                }}
            >
                {new Date(
                    version.savedAt
                ).toLocaleTimeString()}
            </span>

          <button
    onClick={async () => {

        const response =
            await restoreVersion(
                version._id
            )

        console.log(
            "RESTORE RESPONSE",
            response.data
        )

        editor.commands.setContent(
            response.data.content
        )

        console.log(
            "EDITOR UPDATED"
        )

    }}

    className="
    bg-cyan-600
    px-3
    py-1
    rounded
    text-xs
    text-white
    cursor-pointer
    hover:bg-cyan-700
    "
>
    Restore
</button>

        </div>

    ))}

    </div>

</div>


            <div className="bg-slate-950 rounded-2xl min-h-[300px]">
                {
currentRole === "Viewer" && (

<div
style={{
color: "#ff6b6b",
marginBottom: "10px",
fontWeight: "bold"
}}
>
👀 Read Only Mode
</div>


)
}

                <EditorContent
                    editor={editor}
                />

            </div>

        </div>

    )

}
