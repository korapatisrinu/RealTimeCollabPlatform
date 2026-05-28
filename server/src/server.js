const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const http = require("http")
const multer = require("multer")

const connectDB = require("./config/db")

const authRoutes = require("./routes/authRoutes")
const roomRoutes = require("./routes/roomRoutes")
const documentRoutes =
require("./routes/documentRoutes")

const setupSocket = require("./sockets/socket")

const Message = require("./models/Message")

dotenv.config()

connectDB()

const app = express()
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads")

    },

    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() + "-" + file.originalname
        )

    }

})

const upload = multer({
    storage
})

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// AUTH ROUTES
app.use("/api/auth", authRoutes)

// ROOM ROUTES
app.use("/api/rooms", roomRoutes)
app.use(
    "/documents",
    documentRoutes
)

// TEST ROUTE
app.get("/", (req, res) => {

    res.send("Backend Running Successfully")

})

// LOAD OLD MESSAGES
app.get("/messages/:room", async (req, res) => {

    try {

        const messages = await Message.find({
            room: req.params.room
        }).sort({
            createdAt: 1
        })

        res.json(messages)

    } catch (error) {

        res.status(500).json({
            message: "Error loading messages"
        })

    }

})

// DELETE MESSAGE
app.delete("/messages/:id", async (req, res) => {

    try {

        await Message.findByIdAndDelete(req.params.id)

        res.json({
            message: "Message Deleted"
        })

    } catch (error) {

        res.status(500).json({
            message: "Delete Failed"
        })

    }

})

const server = http.createServer(app)

app.put("/messages/:id", async (req, res) => {

    try {

        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            {
                message: req.body.message
            },
            {
                new: true
            }
        )

        res.json(updatedMessage)

    } catch (error) {

        res.status(500).json({
            message: "Update Failed"
        })

    }

})
app.post(
    "/upload",
    upload.single("file"),
    (req, res) => {

        res.json({

            fileUrl:
                `http://localhost:5000/uploads/${req.file.filename}`,

            fileName:
                req.file.originalname

        })

    }
)
// AVATAR ROUTE
app.post(
    "/upload-avatar",
    upload.single("file"),
    async (req, res) => {

        try {

            res.json({

                avatarUrl:
                    `http://localhost:5000/uploads/${req.file.filename}`

            })

        } catch (error) {

            res.status(500).json({

                message:
                    "Avatar Upload Failed"

            })

        }

    }
)

// SOCKET CONNECTION
setupSocket(server)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`)

})
