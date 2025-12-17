import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";

export default function ResetPasswordConfirm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;

    const res = await fetch(`http://localhost:5000/api/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    setMsg(data.message || data.error);
    if (res.ok) setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-sky-700">Create New Password</h2>

        {msg && <p className="text-sm text-green-600">{msg}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input type="password" name="password" placeholder="New Password" required />
          <Button className="w-full">Update Password</Button>
        </form>
      </Card>
    </div>
  );
}
