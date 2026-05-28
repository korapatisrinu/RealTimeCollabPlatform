const express = require("express")

const router = express.Router()


const {
    saveDocument,
    getDocument,
    getVersions,
    restoreVersion,
    exportPDF,
    exportWord,
    sendDocumentEmail
} = require("../controllers/documentController")

router.post(
    "/save",
    saveDocument
)
router.get(
    "/versions/:room",
    getVersions
)

router.get(
    "/:room",
    getDocument
)
router.post(
    "/restore/:id",
    restoreVersion
)
router.get(
    "/export/pdf/:room",
    exportPDF
)
router.get(
    "/export/word/:room",
    exportWord
)
router.post(
    "/share-email",
    sendDocumentEmail
)


module.exports = router