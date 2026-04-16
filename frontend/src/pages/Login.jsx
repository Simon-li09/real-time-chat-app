import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Github, Mail } from "lucide-react";
import API from "../services/api";
import DynamicParticles from "../components/DynamicParticles";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setIsError(false);
        
        try {
            const res = await API.post("/auth/login/", { 
                username: username.trim(), 
                password: password.trim() 
            });
            localStorage.setItem("token", res.data.access);
            if (res.data.user) {
                localStorage.setItem("user", JSON.stringify(res.data.user));
            }
            window.location.href = "/chat";
        } catch (err) {
            setIsError(true);
            setTimeout(() => setIsError(false), 600);
            alert("Login failed: " + (err.response?.data?.detail || "Invalid credentials"));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.dataset.theme;
        document.documentElement.dataset.theme = currentTheme === 'light' ? 'dark' : 'light';
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-[color:var(--bg)] transition-colors duration-300 overflow-hidden">
            <DynamicParticles />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative w-[min(420px,90%)] px-8 py-10 bg-glass shadow-glass rounded-[2rem] overflow-hidden z-10 ${isError ? 'animate-shake auth-card-error' : ''}`}
            >
                <button 
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-xl text-white border-none cursor-pointer transition-all hover:bg-white/20 hover:rotate-12 active:scale-95"
                >
                    ☀️
                </button>

                <div className="flex flex-col gap-[1.4rem]">
                    <div className="text-center">
                        <h2 className="text-[2rem] mb-2 text-gradient font-bold tracking-tight">Welcome back</h2>
                        <p className="text-white/50 text-sm">Enter your credentials to continue</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-[1.4rem]">
                        <div className="relative group">
                            <input
                                id="login-username"
                                className="w-full px-[1.2rem] py-[1.1rem] bg-white/5 border border-white/10 rounded-2xl text-white text-base transition-all duration-300 focus:outline-none focus:border-[color:var(--primary)] focus-glow peer placeholder-transparent"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <label 
                                htmlFor="login-username" 
                                className="absolute left-[1.2rem] top-[1.1rem] text-white/40 pointer-events-none transition-all duration-300 peer-focus:-translate-y-9 peer-focus:left-1 peer-focus:text-[0.85rem] peer-focus:text-[color:var(--primary)] peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:left-1 peer-[:not(:placeholder-shown)]:text-[0.85rem] peer-[:not(:placeholder-shown)]:text-white/60"
                            >
                                Username or Email
                            </label>
                        </div>

                        <div className="relative group">
                            <input
                                id="login-pass"
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-[1.2rem] pr-[3.5rem] py-[1.1rem] bg-white/5 border border-white/10 rounded-2xl text-white text-base transition-all duration-300 focus:outline-none focus:border-[color:var(--primary)] focus-glow peer placeholder-transparent"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label 
                                htmlFor="login-pass" 
                                className="absolute left-[1.2rem] top-[1.1rem] text-white/40 pointer-events-none transition-all duration-300 peer-focus:-translate-y-9 peer-focus:left-1 peer-focus:text-[0.85rem] peer-focus:text-[color:var(--primary)] peer-[:not(:placeholder-shown)]:-translate-y-9 peer-[:not(:placeholder-shown)]:left-1 peer-[:not(:placeholder-shown)]:text-[0.85rem] peer-[:not(:placeholder-shown)]:text-white/60"
                            >
                                Password
                            </label>
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-all p-1 active:scale-90"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={showPassword ? "hide" : "show"}
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </motion.div>
                                </AnimatePresence>
                            </button>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="group relative overflow-hidden p-[1.1rem] bg-btn-gradient text-white border-none rounded-2xl font-bold cursor-pointer transition-all duration-300 shadow-btn hover:-translate-y-1 hover:shadow-btn-hover disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                ) }
                            </div>
                        </button>

                        <div className="flex items-center gap-4 my-2">
                            <div className="h-[1px] flex-1 bg-white/10" />
                            <span className="text-white/30 text-xs font-medium uppercase tracking-widest">Or continue with</span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/80 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95 group">
                                <Github size={20} className="transition-transform group-hover:rotate-12" />
                                <span className="font-medium">GitHub</span>
                            </button>
                            <button type="button" className="flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/80 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95 group">
                                <Mail size={20} className="transition-transform group-hover:-rotate-12" />
                                <span className="font-medium">Google</span>
                            </button>
                        </div>

                        <div className="text-center text-white/40 text-[0.95rem] mt-4">
                            Don't have an account? <a href="/register" className="text-[color:var(--primary)] font-semibold no-underline hover:text-[color:var(--primary-glow)] hover:underline ml-1 transition-colors">Create one</a>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;
