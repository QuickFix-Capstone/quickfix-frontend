// import {
//   signUp,
//   confirmSignUp,
//   signIn,
//   resendSignUpCode,
//   fetchAuthSession,
// } from "aws-amplify/auth";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthCard from "../../components/auth/AuthCard";
// import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
// import AuthDivider from "../../components/auth/AuthDivider";

// export default function Signup() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [code, setCode] = useState("");
//   const [step, setStep] = useState("signup"); // signup | confirm
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Normalize once, reuse everywhere
//   const normalizedEmail = email.trim().toLowerCase();

//   // ===============================
//   // SIGN UP
//   // ===============================
//   const handleSignup = async () => {
//     if (!normalizedEmail || !password || loading) return;

//     setLoading(true);
//     setError("");

//     try {
//       const { nextStep } = await signUp({
//         username: normalizedEmail,
//         password,
//         options: {
//           userAttributes: { email: normalizedEmail },
//         },
//       });

//       if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
//         setStep("confirm");
//       } else {
//         // Auto-confirmed users
//         await signIn({ username: normalizedEmail, password });
//         await fetchAuthSession({ forceRefresh: true });
//         navigate("/onboarding", { replace: true });
//       }
//     } catch (e) {
//       setError(e.message || "Failed to create account");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ===============================
//   // CONFIRM SIGN UP
//   // ===============================
//   const handleConfirm = async () => {
//     if (loading) return;

//     const cleanCode = code.trim();

//     if (!/^\d{6}$/.test(cleanCode)) {
//       setError("Verification code must be 6 digits");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       await confirmSignUp({
//         username: normalizedEmail,
//         confirmationCode: cleanCode,
//       });

//       await signIn({ username: normalizedEmail, password });
//       await fetchAuthSession({ forceRefresh: true });

//       navigate("/onboarding", { replace: true });
//     } catch (e) {
//       if (e.name === "CodeMismatchException") {
//         setError("Invalid verification code.");
//       } else if (e.name === "ExpiredCodeException") {
//         setError("Verification code expired. Please resend.");
//       } else if (e.name === "NotAuthorizedException") {
//         // Already confirmed → sign in safely
//         await signIn({ username: normalizedEmail, password });
//         await fetchAuthSession({ forceRefresh: true });
//         navigate("/onboarding", { replace: true });
//       } else {
//         setError(e.message || "Verification failed");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ===============================
//   // RESEND CODE
//   // ===============================
//   const handleResend = async () => {
//     if (!normalizedEmail) return;
//     setError("");

//     try {
//       await resendSignUpCode({ username: normalizedEmail });
//     } catch (e) {
//       setError(e.message || "Failed to resend code");
//     }
//   };

//   // ===============================
//   // UI
//   // ===============================
//   return (
//     <AuthCard
//       title="Join QuickFix"
//       subtitle="Find trusted service providers or offer your skills"
//     >
//       <SocialAuthButtons />
//       <AuthDivider />

//       {step === "signup" && (
//         <>
//           <input
//             className="input"
//             placeholder="Email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />

//           <input
//             className="input mt-3"
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />

//           <button
//             onClick={handleSignup}
//             className="btn-primary mt-4"
//             disabled={loading || !normalizedEmail || !password}
//           >
//             {loading ? "Creating account..." : "Continue"}
//           </button>
//         </>
//       )}

//       {step === "confirm" && (
//         <>
//           <input
//             className="input"
//             placeholder="Verification code"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//           />

//           <button
//             onClick={handleConfirm}
//             className="btn-primary mt-4"
//             disabled={loading || !code}
//           >
//             {loading ? "Verifying..." : "Verify & Continue"}
//           </button>

//           <button
//             onClick={handleResend}
//             className="text-sm text-blue-500 mt-3"
//             type="button"
//             disabled={loading}
//           >
//             Resend code
//           </button>
//         </>
//       )}

//       {error && (
//         <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
//       )}
//     </AuthCard>
//   );
// }

import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
  fetchAuthSession,
} from "aws-amplify/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import AuthCard from "../../components/auth/AuthCard";
import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
import AuthDivider from "../../components/auth/AuthDivider";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState("signup"); // signup | confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();

  // ===============================
  // SIGN UP
  // ===============================
  const handleSignup = async () => {
    if (!normalizedEmail || !password || loading) return;

    setLoading(true);
    setError("");

    try {
      const { nextStep } = await signUp({
        username: normalizedEmail,
        password,
        options: {
          userAttributes: { email: normalizedEmail },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("confirm");
      } else {
        await signIn({ username: normalizedEmail, password });
        await fetchAuthSession({ forceRefresh: true });
        navigate("/onboarding", { replace: true });
      }
    } catch (e) {
      setError(e.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // CONFIRM SIGN UP
  // ===============================
  const handleConfirm = async () => {
    if (loading) return;

    const cleanCode = code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Verification code must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmSignUp({
        username: normalizedEmail,
        confirmationCode: cleanCode,
      });

      await signIn({ username: normalizedEmail, password });
      await fetchAuthSession({ forceRefresh: true });
      navigate("/onboarding", { replace: true });
    } catch (e) {
      if (e.name === "CodeMismatchException") {
        setError("Invalid verification code.");
      } else if (e.name === "ExpiredCodeException") {
        setError("Verification code expired. Please resend.");
      } else if (e.name === "NotAuthorizedException") {
        await signIn({ username: normalizedEmail, password });
        await fetchAuthSession({ forceRefresh: true });
        navigate("/onboarding", { replace: true });
      } else {
        setError(e.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RESEND CODE
  // ===============================
  const handleResend = async () => {
    if (!normalizedEmail) return;
    setError("");

    try {
      await resendSignUpCode({ username: normalizedEmail });
    } catch (e) {
      setError(e.message || "Failed to resend code");
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthCard
          title="Join QuickFix"
          subtitle="Find trusted service providers or offer your skills"
        >
          <SocialAuthButtons />
          <AuthDivider />

          {step === "signup" && (
            <>
              <div className="space-y-1">
                <label className="block text-sm sm:text-base text-neutral-600">
                  Email address
                </label>
                <input
                  className="input h-11 sm:h-12"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1 mt-3 sm:mt-4">
                <label className="block text-sm sm:text-base text-neutral-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="input pr-12 h-11 sm:h-12"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignup}
                className="btn-primary mt-5 sm:mt-6 w-full h-11 sm:h-12 text-base"
                disabled={loading || !normalizedEmail || !password}
              >
                {loading ? "Creating account..." : "Continue"}
              </button>
            </>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm sm:text-base text-neutral-600">
                  We've sent a verification code to{" "}
                  <span className="font-medium text-neutral-900 break-all">{normalizedEmail}</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm sm:text-base text-neutral-600">
                  Verification code
                </label>
                <input
                  className="input h-11 sm:h-12 text-center tracking-widest font-mono"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              <button
                onClick={handleConfirm}
                className="btn-primary w-full h-11 sm:h-12 text-base"
                disabled={loading || !code}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={handleResend}
                className="w-full text-sm sm:text-base text-blue-600 hover:text-blue-700 hover:underline py-2"
                type="button"
                disabled={loading}
              >
                Resend code
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-sm sm:text-base text-neutral-500">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </a>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}
