import { useState } from "react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setMsg(data.message || data.error);
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-sky-700">Reset Password</h2>

        {msg && <p className="text-sm text-sky-700">{msg}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your account email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button className="w-full">Send Reset Link</Button>
        </form>
      </Card>
    </div>
  );
}
