const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({

    room: {
        type: String,
        required: true,
        unique: true
    },

    content: {
        type: String,
        default: ""
    },

    versions: [
        {
            content: String,

            savedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]

})

module.exports =
    mongoose.model(
        "Document",
        documentSchema
    )