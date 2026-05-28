import { useRef, useState, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { toast } from "react-toastify"

const socket =
    io("http://localhost:5000")

const ringtone =
    new Audio("/ringtone.mp3")

export default function VideoCall({
    room,
    username
}) {

    const myVideo = useRef(null)
    const remoteVideo = useRef(null)
    const peerRef = useRef(null)
    const peerConnection = useRef(null)

    const [isCalling, setIsCalling] =
        useState(false)

    const [localStream, setLocalStream] =
        useState(null)

    const [isMuted, setIsMuted] =
        useState(false)

    const [cameraOff, setCameraOff] =
        useState(false)

    const [incomingCall, setIncomingCall] =
        useState(false)

    const [caller, setCaller] =
        useState("")

    const [calling, setCalling] =
        useState(false)

    const [sharingScreen, setSharingScreen] =
        useState(false)

    const createPeer = useCallback(() => {

        if (peerConnection.current) {

            peerConnection.current.close()

        }

        peerConnection.current =
            new RTCPeerConnection({

                iceServers: [

                    {
                        urls:
                            "stun:stun.l.google.com:19302"
                    }

                ]

            })

        peerConnection.current.onicecandidate =
            (event) => {

                if (event.candidate) {

                    socket.emit(
                        "ice_candidate",
                        {
                            room,
                            candidate:
                                event.candidate
                        }
                    )

                }

            }

        peerConnection.current.ontrack =
            (event) => {

                if (remoteVideo.current) {

                    remoteVideo.current.srcObject =
                        event.streams[0]

                }

            }

    }, [room])

    const startVideoStream = useCallback(async () => {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                })

            if (myVideo.current) {

                myVideo.current.srcObject =
                    stream

            }

            setLocalStream(stream)

            return stream

        } catch (error) {

            console.log(error)

            return null

        }

    }, [])

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
            "incoming-call",
            async (data) => {

                const stream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({
                            video: true,
                            audio: true
                        })

                peerRef.current =
                    new RTCPeerConnection({
                        iceServers: [
                            {
                                urls:
                                "stun:stun.l.google.com:19302"
                            }
                        ]
                    })

                stream.getTracks().forEach((track) => {

                    peerRef.current.addTrack(
                        track,
                        stream
                    )

                })

                await peerRef.current
                    .setRemoteDescription(
                        data.offer
                    )

                const answer =
                    await peerRef.current
                        .createAnswer()

                await peerRef.current
                    .setLocalDescription(
                        answer
                    )

                socket.emit(
                    "answer-call",
                    {
                        answer,
                        target:
                        data.caller
                    }
                )

            }
        )

        socket.on(
            "call-answered",
            async (data) => {

                await peerRef.current
                    .setRemoteDescription(
                        data.answer
                    )

            }
        )

        socket.on(
            "incoming_video_call",
            (data) => {

                console.log(
                    "Incoming call:",
                    data
                )

                setIncomingCall(true)

                setCaller(data.caller)

                ringtone.loop = true

                ringtone.play()

            }
        )

        socket.on(
            "incoming_call",
            (data) => {

                toast.info(
                    `\u{1F4DE} ${data.caller} is calling`
                )

                setIncomingCall(true)

                setCaller(
                    data.caller
                )

            }
        )

        socket.on(
            "video_call_accepted",
            () => {

                setCalling(false)

                setIncomingCall(false)

                setIsCalling(true)

                startVideoStream()

            }
        )

        socket.on(
            "call_joined",
            () => {

                setCalling(false)

                setIncomingCall(false)

                setIsCalling(true)

            }
        )

        socket.on(
            "call_ended",
            () => {

                if (myVideo.current) {

                    myVideo.current.srcObject =
                        null

                }

                if (remoteVideo.current) {

                    remoteVideo.current.srcObject =
                        null

                }

                if (peerConnection.current) {

                    peerConnection.current.close()

                    peerConnection.current = null

                }

                setLocalStream(null)

                setIsMuted(false)

                setCameraOff(false)

                setCalling(false)

                setIsCalling(false)

            }
        )

        socket.on(
            "webrtc_offer",
            async (offer) => {

                createPeer()

                await peerConnection.current
                    .setRemoteDescription(
                        new RTCSessionDescription(
                            offer
                        )
                    )

                const stream =
                    await navigator.mediaDevices
                        .getUserMedia({

                            video: true,
                            audio: true

                        })

                if (myVideo.current) {

                    myVideo.current.srcObject =
                        stream

                }

                setLocalStream(stream)

                stream.getTracks()
                    .forEach((track) => {

                        peerConnection.current
                            .addTrack(
                                track,
                                stream
                            )

                    })

                const answer =
                    await peerConnection.current
                        .createAnswer()

                await peerConnection.current
                    .setLocalDescription(
                        answer
                    )

                socket.emit(
                    "webrtc_answer",
                    {
                        room,
                        answer
                    }
                )

            }
        )

        socket.on(
            "webrtc_answer",
            async (answer) => {

                if (!peerConnection.current) return

                await peerConnection.current
                    .setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    )

            }
        )

        socket.on(
            "ice_candidate",
            async (candidate) => {

                if (peerConnection.current) {

                    await peerConnection.current
                        .addIceCandidate(
                            new RTCIceCandidate(
                                candidate
                            )
                        )

                }

            }
        )

        return () => {

            socket.off("incoming-call")

            socket.off("call-answered")

            socket.off("incoming_video_call")

            socket.off("incoming_call")

            socket.off("video_call_accepted")

            socket.off("call_joined")

            socket.off("call_ended")

            socket.off("webrtc_offer")

            socket.off("webrtc_answer")

            socket.off("ice_candidate")

        }

    }, [room, createPeer, startVideoStream])

    const startCall = async () => {

        setCalling(true)

        setIsCalling(true)

        const stream =
            await startVideoStream()

        if (!stream) {

            setCalling(false)

            setIsCalling(false)

            return

        }

        createPeer()

        stream.getTracks().forEach((track) => {

            peerConnection.current.addTrack(
                track,
                stream
            )

        })

        const offer =
            await peerConnection.current
                .createOffer()

        await peerConnection.current
            .setLocalDescription(
                offer
            )

        socket.emit(
            "webrtc_offer",
            {
                room,
                offer
            }
        )

        socket.emit(
            "call_user",
            {
                room,
                username
            }
        )

    }

    const toggleMute = () => {

        if (!localStream) return

        localStream
            .getAudioTracks()
            .forEach((track) => {

                track.enabled =
                    !track.enabled

            })

        setIsMuted(!isMuted)

    }

    const toggleCamera = () => {

        if (!localStream) return

        localStream
            .getVideoTracks()
            .forEach((track) => {

                track.enabled =
                    !track.enabled

            })

        setCameraOff(!cameraOff)

    }

    const shareScreen = async () => {

        try {

            if (sharingScreen) {

                const stream =
                    myVideo.current?.srcObject

                stream
                    ?.getVideoTracks()
                    .forEach((track) => {

                        track.stop()

                    })

                return

            }

            const screenStream =
                await navigator.mediaDevices
                    .getDisplayMedia({
                        video: true
                    })

            const screenTrack =
                screenStream
                    .getVideoTracks()[0]

            const activePeer =
                peerConnection.current ||
                peerRef.current

            const sender =
                activePeer
                    ?.getSenders()
                    .find(
                        (sender) =>
                            sender.track &&
                            sender.track.kind === "video"
                    )

            if (sender) {

                sender.replaceTrack(
                    screenTrack
                )

            }

            setSharingScreen(true)

            if (myVideo.current) {

                myVideo.current.srcObject =
                    screenStream

            }

            screenTrack.onended =
                async () => {

                    const cameraStream =
                        await navigator.mediaDevices
                            .getUserMedia({
                                video: true,
                                audio: true
                            })

                    const cameraTrack =
                        cameraStream
                            .getVideoTracks()[0]

                    const activePeer =
                        peerConnection.current ||
                        peerRef.current

                    const sender =
                        activePeer
                            ?.getSenders()
                            .find(
                                (sender) =>
                                    sender.track &&
                                    sender.track.kind === "video"
                            )

                    if (sender) {

                        sender.replaceTrack(
                            cameraTrack
                        )

                    }

                    setSharingScreen(false)

                    if (myVideo.current) {

                        myVideo.current.srcObject =
                            cameraStream

                    }

                    setLocalStream(cameraStream)

                }

        } catch (error) {

            console.log(error)

        }

    }

    const acceptCall = async () => {

        const stream =
            await startVideoStream()

        if (!stream) {

            return

        }

        setIncomingCall(false)

        setCalling(false)

        setIsCalling(true)

        ringtone.pause()

        ringtone.currentTime = 0

        socket.emit(
            "call_accepted",
            {
                room,
                username
            }
        )

    }

    const rejectCall = () => {

        setIncomingCall(false)

        ringtone.pause()

        ringtone.currentTime = 0

    }

    const endCall = () => {

        if (localStream) {

            localStream
                .getTracks()
                .forEach((track) =>
                    track.stop()
                )

        }

        if (myVideo.current) {

            myVideo.current.srcObject = null

        }

        if (remoteVideo.current) {

            remoteVideo.current.srcObject = null

        }

        if (peerConnection.current) {

            peerConnection.current.close()

            peerConnection.current = null

        }

        setLocalStream(null)

        setIsMuted(false)

        setCameraOff(false)

        setCalling(false)

        setIsCalling(false)

        socket.emit(
            "end_call",
            room
        )

    }

    return (

        <>
        {
        incomingCall && (

        <div
        className="
        fixed
        top-10
        right-10
        bg-slate-900
        p-6
        rounded-2xl
        shadow-xl
        z-50
        "
        >

        <h2
        className="
        text-2xl
        font-bold
        mb-2
        "
        >
        Incoming Call
        </h2>

        <p>
        {caller} is calling...
        </p>

        <div className="flex gap-3 mt-4">

        <button
        onClick={acceptCall}
        className="
        bg-green-600
        px-4
        py-2
        rounded-xl
        "
        >
        Accept
        </button>

        <button
        onClick={rejectCall}
        className="
        bg-red-600
        px-4
        py-2
        rounded-xl
        "
        >
        Reject
        </button>

        </div>

        </div>

        )
        }

        <div className="bg-slate-800 p-6 rounded-3xl mt-6">

            <h2 className="text-3xl font-bold mb-4">
                Video Call
            </h2>

            <div className="flex gap-3 mb-4 flex-wrap">

                {
                    !calling && !isCalling ? (
                        <button
                            onClick={startCall}
                            className="bg-green-600 px-4 py-2 rounded-xl"
                        >
                            📞 Start Call
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={endCall}
                                className="bg-red-600 px-4 py-2 rounded-xl"
                            >
                                📴 End Call
                            </button>

                            <button
                                onClick={toggleMute}
                                className="bg-yellow-500 px-4 py-2 rounded-xl"
                            >
                                {isMuted ? "🔇 Unmute" : "🎤 Mute"}
                            </button>

                            <button
                                onClick={toggleCamera}
                                className="bg-blue-600 px-4 py-2 rounded-xl"
                            >
                                {
                                    cameraOff
                                        ? "📷 Camera On"
                                        : "📷 Camera Off"
                                }
                            </button>

                            <button
                                onClick={shareScreen}
                                className="bg-purple-600 px-4 py-2 rounded-xl"
                            >
                                {
                                    sharingScreen
                                        ? "\u{1F6D1} Stop Sharing"
                                        : "\u{1F5A5}\uFE0F Share Screen"
                                }
                            </button>
                        </>
                    )
                }

            </div>

            {
            calling && (

            <div className="
            bg-yellow-600
            p-4
            rounded-xl
            mb-4
            text-center
            animate-pulse
            ">

            📞 Calling...

            </div>

            )
            }

            <div className="flex gap-6 flex-wrap">

                <div>

                    <h3 className="mb-2">
                        Your Camera
                    </h3>

                    {
                        isCalling && (

                            <video
                                ref={myVideo}
                                autoPlay
                                muted
                                playsInline
                                className="w-96 rounded-2xl border"
                            />

                        )
                    }

                </div>

                <div>

                    <h3 className="mb-2">
                        Remote User
                    </h3>

                    <video
                        ref={remoteVideo}
                        autoPlay
                        playsInline
                        className="w-96 rounded-2xl border"
                    />

                </div>

            </div>

        </div>

        </>

    )

}
