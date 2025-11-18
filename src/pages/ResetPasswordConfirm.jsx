import React, { useState } from "react";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import { Lock } from "lucide-react";

export default function ResetPasswordConfirm({
  onResetPassword,
  error,
  info,
  onBackToLogin,
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) return;
    onResetPassword(password);
  };

  const mismatch = password && confirm && password !== confirm;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Set new password</h1>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1 text-sm">
            <label className="font-medium">New password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Confirm password</label>
            <Input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {mismatch && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              Passwords do not match.
            </div>
          )}

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

          <Button
            className="w-full mt-2"
            type="submit"
            disabled={!password || mismatch}
          >
            Save new password
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
