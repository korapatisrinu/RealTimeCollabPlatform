const express = require("express")
const router = express.Router()

const Room = require("../models/Room")

// CREATE ROOM
router.post("/create", async (req, res) => {

    try {

        const { roomName, createdBy } = req.body

        // CHECK ROOM EXISTS
        const existingRoom = await Room.findOne({ roomName })

        if (existingRoom) {

            return res.status(400).json({
                message: "Room already exists"
            })

        }

        // CREATE ROOM
        const newRoom = new Room({
            roomName,
            createdBy
        })

        await newRoom.save()

        res.status(201).json(newRoom)

    } catch (error) {

        res.status(500).json({
            message: "Error creating room"
        })

    }

})

// GET ALL ROOMS
router.get("/", async (req, res) => {

    try {

        const rooms = await Room.find().sort({
            createdAt: -1
        })

        res.json(rooms)

    } catch (error) {

        res.status(500).json({
            message: "Error fetching rooms"
        })

    }

})
router.delete("/:id", async (req, res) => {

    try {

        await Room.findByIdAndDelete(req.params.id)

        res.json({
            message: "Room Deleted"
        })

    } catch (error) {

        res.status(500).json({
            message: "Delete Failed"
        })

    }

})
module.exports = router