const mongoose = require("mongoose")

const documentVersionSchema =
new mongoose.Schema({

    room: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    savedAt: {
        type: Date,
        default: Date.now
    }

})

module.exports =
mongoose.model(
    "DocumentVersion",
    documentVersionSchema
)