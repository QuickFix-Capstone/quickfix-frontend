import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    preferences: "",
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/register/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, role: "customer" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(data.error);
      return;
    }

    setMsg("🎉 Account created! Redirecting...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-sky-700">Customer Sign Up</h2>
        {msg && <p className="text-sm text-green-600">{msg}</p>}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input name="name" placeholder="Full Name" required onChange={handleChange} />
          <Input name="email" type="email" placeholder="Email" required onChange={handleChange} />
          <Input name="phone" placeholder="Phone" required onChange={handleChange} />
          <Input name="password" type="password" placeholder="Password" required onChange={handleChange} />
          <Input name="preferences" placeholder="Preferences (Optional)" />

          <Button type="submit" className="w-full">Create Account</Button>
        </form>

        <p className="text-sm text-center">
          Already have an account? <Link to="/login" className="text-sky-600">Login</Link>
        </p>
      </Card>
    </div>
  );
}
