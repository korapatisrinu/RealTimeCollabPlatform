import axios from "axios"

export const restoreVersion = (id) => {

    return axios.post(
        `http://localhost:5000/documents/restore/${id}`
    )

}

export const shareDocumentEmail = (
    email,
    room
) => {

    return axios.post(
        "http://localhost:5000/documents/share-email",
        {
            email,
            room
        }
    )

}
