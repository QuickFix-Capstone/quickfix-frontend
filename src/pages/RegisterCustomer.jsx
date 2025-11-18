import React, { useState } from "react";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import TextArea from "../components/UI/TextArea";
import Button from "../components/UI/Button";
import { User, Mail, Lock } from "lucide-react";

export default function RegisterCustomer({ onRegister, error, onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "customer",
      extra: { preferences },
    });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Customer Registration</h1>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1 text-sm">
            <label className="font-medium">Full name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Password</label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-neutral-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Preferences (optional)</label>
            <TextArea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., prefers morning appointments, non-smoking technician..."
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <Button className="w-full mt-2" type="submit">
            Create Account
          </Button>
        </form>

        <button
          type="button"
          className="mt-2 text-xs text-neutral-600 underline underline-offset-2"
          onClick={onBackToLogin}
        >
          Back to login
        </button>
      </Card>
    </div>
  );
}
