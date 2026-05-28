const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({

    room: {
        type: String,
        required: true
    },

    author: {
        type: String,
        required: true
    },

    message: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    fileName: {
        type: String,
        default: ""
    },

    replyTo: {

        author: {
            type: String,
            default: ""
        },
        

        message: {
            type: String,
            default: ""
        }

    },
    reactions: {
    type: Object,
    default: {}
},
seen: {
    type: Boolean,
    default: false
},
    

},

{
    timestamps: true
})

module.exports = mongoose.model(
    "Message",
    messageSchema
)