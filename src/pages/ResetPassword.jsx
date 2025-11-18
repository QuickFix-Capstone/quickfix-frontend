import React, { useState } from "react";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import { Mail, RefreshCw } from "lucide-react";

export default function ResetPassword({ onRequestReset, info, error, onBack }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestReset(email.trim());
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Reset password</h1>
        </div>

        <p className="text-xs text-neutral-600">
          Enter the email you used to register. For this demo, we’ll “send” a
          reset link and then let you set a new password on the next screen.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1 text-sm">
            <label className="font-medium">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {info}
            </div>
          )}

          <Button className="w-full mt-2" type="submit">
            Send reset link (demo)
          </Button>
        </form>

        <button
          type="button"
          className="mt-2 text-xs text-neutral-600 underline underline-offset-2"
          onClick={onBack}
        >
          Back to login
        </button>
      </Card>
    </div>
  );
}
