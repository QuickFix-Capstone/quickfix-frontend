// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import { User, Briefcase } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white" />

      <Card className="w-full max-w-2xl border-neutral-200/60 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Welcome to QuickFix
          </h1>
          <p className="mt-2 text-neutral-600">
            Choose how you'd like to continue
          </p>
        </div>

        {/* Two Options */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Option */}
          <Card className="border-2 border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-neutral-900">
                I'm a Customer
              </h2>
              <p className="mb-6 text-sm text-neutral-600">
                Book trusted service providers for your home and business needs
              </p>
              <Button
                onClick={() => navigate("/customer/login")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue as Customer
              </Button>
            </div>
          </Card>

          {/* Service Provider Option */}
          <Card className="border-2 border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-neutral-900">
                I'm a Service Provider
              </h2>
              <p className="mb-6 text-sm text-neutral-600">
                Grow your business by connecting with customers who need your services
              </p>
              <Button
                onClick={() => navigate("/provider/login")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue as Provider
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} QuickFix. All rights reserved.
        </p>
      </Card>
    </div>
  );
}