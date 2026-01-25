import { useState } from "react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) {
    navigate("/signup");
    return null;
  }

  const handleVerify = async () => {
    setError("");
    setLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      navigate("/login");
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    await resendSignUpCode({ username: email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Verify your email
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Enter the code sent to{" "}
              <span className="font-medium text-gray-900 break-all">{email}</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Verification code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full h-11 sm:h-12 px-4 rounded-xl border border-gray-300
                         text-center text-lg tracking-widest font-mono
                         focus:ring-2 focus:ring-black focus:border-black
                         transition placeholder:text-gray-400"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={loading || !code}
              className="w-full h-11 sm:h-12 rounded-xl bg-black text-white font-medium
                         hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <button
              onClick={resendCode}
              disabled={loading}
              className="w-full h-10 sm:h-11 rounded-xl border border-gray-300 text-gray-700 font-medium
                         hover:bg-gray-50 transition disabled:opacity-50"
            >
              Resend code
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Didn't receive the code? Check your spam folder or{" "}
            <button
              onClick={resendCode}
              className="text-blue-600 hover:underline font-medium"
            >
              request a new one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
