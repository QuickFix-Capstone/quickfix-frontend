// src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import { User, Briefcase } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="mx-auto max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">
            Welcome to QuickFix
          </h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 mb-4" />
          <p className="text-lg text-neutral-600">
            Choose how you'd like to continue
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <Card className="p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-indigo-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 mb-4">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                I'm a Customer
              </h2>
              <p className="text-neutral-600 mb-6">
                Book trusted service providers for your home and business needs
              </p>

              {/* Benefits */}
              <ul className="text-left text-sm text-neutral-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">✓</span>
                  <span>Browse hundreds of services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">✓</span>
                  <span>Book instantly with trusted providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">✓</span>
                  <span>Secure payments and reviews</span>
                </li>
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:opacity-90"
                onClick={() => navigate("/customer/login")}
              >
                Continue as Customer
              </Button>
            </div>
          </Card>

          {/* Service Provider Card */}
          <Card className="p-8 hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-emerald-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 mb-4">
                <Briefcase className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                I'm a Service Provider
              </h2>
              <p className="text-neutral-600 mb-6">
                Grow your business by connecting with customers who need your services
              </p>

              {/* Benefits */}
              <ul className="text-left text-sm text-neutral-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Reach thousands of customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Manage bookings and services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Get paid quickly and securely</span>
                </li>
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:opacity-90"
                onClick={() => navigate("/service-provider/login")}
              >
                Continue as Provider
              </Button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-neutral-400 text-sm">
          © {new Date().getFullYear()} QuickFix. All rights reserved.
        </p>
      </div>
    </div>
  );
}
