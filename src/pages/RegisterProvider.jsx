import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";

export default function RegisterProvider() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    service_type: "", license_info: "", service_area: ""
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const res = await fetch("http://localhost:5000/register/provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }

    setMsg("🎉 Provider registered! Redirecting...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-sky-700">
          Create Provider Account
        </h2>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input name="name" placeholder="Business or Full Name" required onChange={handleChange} />
          <Input name="email" type="email" placeholder="Email" required onChange={handleChange} />
          <Input name="phone" placeholder="Phone" required onChange={handleChange} />
          <Input name="password" type="password" placeholder="Password" required onChange={handleChange} />
          <Input name="service_type" placeholder="Service Type" required onChange={handleChange} />
          <Input name="license_info" placeholder="License Info" onChange={handleChange} />
          <Input name="service_area" placeholder="Service Area (City / KM)" required onChange={handleChange} />

          <Button type="submit" className="w-full">Register & Verify</Button>
        </form>

        <p className="text-sm text-center">
          Already registered? <Link to="/login" className="text-sky-600">Login</Link>
        </p>
      </Card>
    </div>
  );
}
