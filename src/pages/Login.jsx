import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { Mail, Lock } from "lucide-react";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("quickfix_currentUser", JSON.stringify(data));
      if (onLogin) onLogin(data);

      navigate("/profile");
    } catch {
      setError("⚠️ Backend not running. Please start server!");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-gray-200 px-4">
      
      {/* Container Animation */}
      <div className="animate-fadeIn w-full max-w-md">
        <Card className="rounded-3xl p-8 shadow-2xl bg-white/90 backdrop-blur-md border border-neutral-100 space-y-6">

          {/* Logo / Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              QuickFix
            </h1>
            <p className="text-neutral-600 text-sm">Your trusted home service network</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 text-sm p-2 rounded-lg border border-red-300 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-neutral-50 focus-within:ring-2 focus-within:ring-blue-300">
                <Mail className="h-4 w-4 text-neutral-500" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 border-0 bg-transparent focus:ring-0"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-neutral-50 focus-within:ring-2 focus-within:ring-blue-300">
                <Lock className="h-4 w-4 text-neutral-500" />
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1 border-0 bg-transparent focus:ring-0"
                />
              </div>
            </div>

            {/* Role Toggle */}
            <div className="flex gap-3 justify-center mt-3">
              {["customer", "provider"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  onClick={() => setRole(type)}
                  className={`flex-1 py-2 rounded-xl transition shadow-sm
                    ${
                      role === type
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-neutral-200 text-black hover:bg-neutral-300"
                    }`}
                >
                  {type === "customer" ? "Customer" : "Provider"}
                </Button>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md"
            >
              Login
            </Button>

          </form>

          {/* Forgot password */}
          <div className="text-center">
            <Link to="/reset-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Register */}
          <div className="text-center text-sm mt-4 space-y-2">
            <p>New to QuickFix?</p>
            <div className="flex gap-2">
              <Link to="/register" className="w-full">
                <Button variant="ghost" className="w-full py-2 rounded-xl hover:bg-blue-50">
                  Customer Register
                </Button>
              </Link>
              <Link to="/register/provider" className="w-full">
                <Button variant="ghost" className="w-full py-2 rounded-xl hover:bg-blue-50">
                  Provider Register
                </Button>
              </Link>
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
}
