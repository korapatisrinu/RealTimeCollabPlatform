import { registerUser } from "../services/authService"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

export default function Register() {

    const navigate = useNavigate()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleRegister = async (e) => {
    e.preventDefault()

    try {

        const response = await registerUser({
            name,
            email,
            password
        })

        console.log(response)

        alert("Registration Successful")

        navigate("/")

    } catch (error) {

        console.log(error)

        alert("Registration Failed")

    }
}

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] px-5">

            <div className="bg-slate-900 w-full max-w-md p-10 rounded-3xl shadow-2xl border border-slate-800">

                <div className="text-center mb-8">

                    <h1 className="text-5xl font-bold text-white mb-3">
                        Create Account
                    </h1>

                    <p className="text-slate-400 text-sm">
                        Join the Real-Time Collaboration Platform
                    </p>

                </div>

                <form onSubmit={handleRegister} className="space-y-5">

                    <input
                        type="text"
                        placeholder="Enter Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-green-500"
                    />

                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-green-500"
                    />

                    {/* Password Input */}
                    <div className="relative">

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-green-500"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-slate-400"
                        >
                            {showPassword ? "🙈" : "👁"}
                        </button>

                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-semibold transition duration-300"
                    >
                        Register
                    </button>

                </form>

                <div className="mt-8 text-center">

                    <p className="text-slate-400 text-sm">
                        Already have an account?
                    </p>

                    <Link
                        to="/"
                        className="text-green-400 hover:text-green-300 font-semibold"
                    >
                        Login Here
                    </Link>

                </div>

                <div className="mt-8 border-t border-slate-800 pt-5 text-center">

                    <p className="text-xs text-slate-500">
                        Real-Time Collaboration Platform © 2026
                    </p>

                </div>

            </div>

        </div>
    )
}