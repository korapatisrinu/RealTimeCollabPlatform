import CanvasDraw from "react-canvas-draw"
import { useRef, useEffect, useState } from "react"
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default function Whiteboard({ room, username }) {

    const canvasRef = useRef(null)

    const [saveData, setSaveData] = useState("")

    useEffect(() => {

        if (!room || !username) return

        socket.emit(
            "join_room",
            {
                room,
                username
            }
        )

    }, [room, username])

    useEffect(() => {

        socket.on(
            "receive_drawing",
            (data) => {

                console.log("RECEIVED DRAWING:", data)

                if (!canvasRef.current) return

                if (!data || data === "") {

                    console.log("CLEAR RECEIVED")

                    canvasRef.current.clear()

                    return

                }

                canvasRef.current.loadSaveData(
                    data,
                    true
                )

            }
        )

        return () => {

            socket.off("receive_drawing")

        }

    }, [saveData])

    const handleChange = () => {

        if (!canvasRef.current) return

        const data =
            canvasRef.current.getSaveData()

        setSaveData(data)

        clearTimeout(window.drawingTimeout)

        window.drawingTimeout = setTimeout(() => {

            socket.emit("send_drawing", {
                room,
                drawing: data
            })

        }, 200)

    }

    const clearBoard = () => {

        console.log("CLEAR CLICKED")

        canvasRef.current.clear()

        socket.emit(
            "send_drawing",
            {
                room,
                drawing: ""
            }
        )

    }

    return (

        <div className="bg-slate-800 p-6 rounded-3xl mt-6 overflow-hidden border border-slate-700">

            <div className="flex justify-between items-center mb-4">

                <h2 className="text-3xl font-bold">
                    Shared Whiteboard
                </h2>

                <button
                    onClick={clearBoard}
                    className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-2xl transition-all duration-300"
                >
                    Clear
                </button>

            </div>

            <div className="w-full overflow-hidden rounded-2xl">

                <CanvasDraw
                    ref={canvasRef}
                    onChange={handleChange}
                    brushRadius={3}
                    lazyRadius={0}
                    hideGrid={false}
                   canvasWidth={
    window.innerWidth > 768
        ? window.innerWidth - 500
        : window.innerWidth - 60
}
                   canvasHeight={
    window.innerWidth > 768
        ? 450
        : 300
}
                    backgroundColor="#0f172a"
                    brushColor="#ffffff"
                    className="rounded-2xl w-full"
                />

            </div>

        </div>

    )

}
