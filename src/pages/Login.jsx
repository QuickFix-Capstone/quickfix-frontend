// src/pages/Login.jsx
import React, { useState } from "react";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import GhostButton from "../components/UI/GhostButton";
import { Mail, Lock, UserCircle2, Loader2 } from "lucide-react";

export default function Login({
  onLogin,
  error,
  onGoRegisterCustomer,
  onGoRegisterProvider,
  onGoResetPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onLogin(email.trim(), password, role);
    } catch (err) {
      // Error is handled by parent and passed back via props
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserCircle2 className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Login to QuickFix</h1>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1 text-sm">
            <label className="font-medium">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Password</label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-neutral-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <label className="font-medium">Login as</label>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                disabled={isLoading}
                className={`rounded-full px-3 py-1 border transition-colors ${role === "customer"
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setRole("customer")}
              >
                Customer
              </button>
              <button
                type="button"
                disabled={isLoading}
                className={`rounded-full px-3 py-1 border transition-colors ${role === "provider"
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setRole("provider")}
              >
                Service Provider
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <Button className="w-full mt-2" type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
          <button
            type="button"
            className="underline underline-offset-2 disabled:opacity-50"
            onClick={onGoResetPassword}
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        <div className="mt-2 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
          <div className="mb-2">New to QuickFix?</div>
          <div className="flex gap-2">
            <GhostButton
              className="flex-1"
              onClick={onGoRegisterCustomer}
              disabled={isLoading}
            >
              Register as Customer
            </GhostButton>
            <GhostButton
              className="flex-1"
              onClick={onGoRegisterProvider}
              disabled={isLoading}
            >
              Register as Provider
            </GhostButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
