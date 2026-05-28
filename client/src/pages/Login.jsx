import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loginUser } from "../services/authService"

export default function Login() {

    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async (e) => {

        e.preventDefault()

        try {

            const data = await loginUser({
                email,
                password
            })

            localStorage.setItem("token", data.token)

            alert("Login Successful")

            navigate("/dashboard")

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Login Failed"
            )
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] px-5">

            <div className="bg-slate-900 w-full max-w-md p-10 rounded-3xl shadow-2xl border border-slate-800">

                <div className="text-center mb-8">

                    <h1 className="text-5xl font-bold text-white mb-3">
                        Welcome Back
                    </h1>

                    <p className="text-slate-400 text-sm">
                        Sign in to continue to your workspace
                    </p>

                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                    />

                    <div className="relative">

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-slate-400"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>

                    </div>

                    <div className="flex justify-end">

                        <button
                            type="button"
                            className="text-sm text-blue-400 hover:text-blue-300"
                        >
                            Forgot Password?
                        </button>

                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold transition duration-300"
                    >
                        Login
                    </button>

                </form>

                <div className="mt-8 text-center">

                    <p className="text-slate-400 text-sm">
                        Don’t have an account?
                    </p>

                    <Link
                        to="/register"
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                        Create New Account
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