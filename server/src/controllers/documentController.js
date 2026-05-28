
const Document = require("../models/Document")
const PDFDocument = require("pdfkit")
const nodemailer = require("nodemailer")

const {
    Document: DocxDocument,
    Packer,
    Paragraph
} = require("docx")

// SAVE DOCUMENT
exports.saveDocument = async (req, res) => {
    try {

        const { room, content } = req.body

        const document =
    await Document.findOneAndUpdate(
        { room },
        {
            content,

            $push: {
                versions: {
                    content,
                    savedAt: new Date()
                }
            }
        },
        {
            upsert: true,
            new: true
        }
    )

        res.json(document)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Save failed"
        })

    }
}

// GET DOCUMENT
exports.getDocument = async (req, res) => {

    try {

        const document =
            await Document.findOne({
                room: req.params.room
            })

        res.json(document)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Fetch failed"
        })

    }


}
// GET DOCUMENT VERSIONS
exports.getVersions = async (req, res) => {

    try {

        const document =
            await Document.findOne({
                room: req.params.room
            })

        if (!document) {

            return res.json([])

        }

        res.json(
            document.versions || []
        )

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Fetch versions failed"
        })

    }

}
exports.restoreVersion = async (req, res) => {

    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message:
                "Invalid version id"
            })
        }

        const document =
            await Document.findOne({
                "versions._id":
                req.params.id
            })

        if (!document) {

            return res.status(404).json({
                message:
                "Version not found"
            })

        }

        const version =
            document.versions.id(
                req.params.id
            )

        document.content =
            version.content

        await document.save()

        res.json(document)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message:
            "Restore failed"
        })

    }

}
exports.exportPDF = async (req, res) => {

    try {

        const document =
            await Document.findOne({
                room: req.params.room
            })

        if (!document) {

            return res.status(404).json({
                message: "Document not found"
            })

        }

        const pdf = new PDFDocument()

        res.setHeader(
            "Content-Type",
            "application/pdf"
        )

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${req.params.room}.pdf`
        )

        pdf.pipe(res)

        const cleanText =
    document.content.replace(
        /<[^>]*>/g,
        ""
    )

pdf.text(cleanText)

        pdf.end()

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Export PDF failed"
        })

    }

}
exports.exportWord = async (req, res) => {

    try {

        const document =
            await Document.findOne({
                room: req.params.room
            })

        if (!document) {

            return res.status(404).json({
                message: "Document not found"
            })

        }

        const cleanText =
            document.content.replace(
                /<[^>]*>/g,
                ""
            )

        const doc = new DocxDocument({

            sections: [
                {
                    properties: {},

                    children: [
                        new Paragraph(
                            cleanText
                        )
                    ]
                }
            ]

        })

        const buffer =
            await Packer.toBuffer(doc)

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${req.params.room}.docx`
        )

        res.send(buffer)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message:
            "Export Word failed"
        })

    }

}
exports.sendDocumentEmail = async (req, res) => {

    try {

        const { email, room } = req.body

        const document = await Document.findOne({
            room
        })

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            })
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Shared Document - ${room}`,
            text: document.content.replace(/<[^>]*>/g, "")
        })

        res.json({
            message: "Email sent successfully"
        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Email send failed"
        })

    }

}