import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../auth/localAuth";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    try {
      registerUser({
        name,
        email,
        password,
        role: "customer",
        extra: { preferences }
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Customer Registration</h2>

        <Input placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} />

        <Input placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} />

        <Input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} />

        <textarea
          className="w-full p-2 border rounded-lg text-sm"
          placeholder="Preferences (optional)"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSubmit}>Create Account</Button>

        <Link to="/login" className="text-sm underline">Back to login</Link>
      </Card>
    </div>
  );
}
