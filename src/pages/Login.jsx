import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { loginUser } from "../auth/localAuth";
import { Mail, Lock } from "lucide-react";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const user = loginUser(email, password, role);
      if (onLogin) onLogin(user);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md p-6 space-y-4">

        <h2 className="text-xl font-semibold">Login to QuickFix</h2>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="space-y-1">
            <label>Email</label>
            <div className="flex items-center gap-2 border rounded-md px-2">
              <Mail className="h-4 w-4 text-neutral-500" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 border-0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label>Password</label>
            <div className="flex items-center gap-2 border rounded-md px-2">
              <Lock className="h-4 w-4 text-neutral-500" />
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 border-0"
              />
            </div>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-2 justify-center mt-2">
            <Button
              type="button"
              className={role === "customer" ? "bg-black text-white" : "bg-neutral-200"}
              onClick={() => setRole("customer")}
            >
              Customer
            </Button>

            <Button
              type="button"
              className={role === "provider" ? "bg-black text-white" : "bg-neutral-200"}
              onClick={() => setRole("provider")}
            >
              Service Provider
            </Button>
          </div>

          <Button type="submit" className="w-full bg-black text-white">
            Login
          </Button>
        </form>

        <div className="text-center">
          <Link to="/reset-password" className="text-sm text-blue-600">
            Forgot password?
          </Link>
        </div>

        {/* ➜ New Register Buttons */}
        <div className="text-center text-sm mt-4">
        <p className="mb-2">New to QuickFix?</p>
        <div className="flex gap-2">
        <Link to="/register">
          <Button variant="ghost" className="w-full">Customer Register</Button>
        </Link>
      <Link to="/register/provider">
          <Button variant="ghost" className="w-full">Provider Register</Button>
        </Link>
      </div>
    </div>
      </Card>
    </div>
  );
}
