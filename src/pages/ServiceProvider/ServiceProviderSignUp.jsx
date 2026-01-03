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
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [code, setCode] = useState("");
//   const [step, setStep] = useState("signup");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   const handleSignup = async () => {
//     if (!email || !password) return;

//     setError("");
//     setLoading(true);

//     try {
//       await signUp({
//         username: email,
//         password,
//         options: { userAttributes: { email } },
//       });

//       setStep("confirm");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConfirm = async () => {
//     if (!code) return;

//     setError("");
//     setLoading(true);

//     try {
//       await confirmSignUp({
//         username: email,
//         confirmationCode: code,
//       });

//       // Auto-login after verification
//       await signIn({ username: email, password });

//       navigate("/auth/redirect", { replace: true });
//     } catch (e) {
//       setError(
//         e.name === "CodeMismatchException"
//           ? "Invalid verification code."
//           : e.name === "ExpiredCodeException"
//           ? "Verification code expired. Please resend."
//           : e.message
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     setError("");

//     try {
//       await resendSignUpCode({ username: email });
//     } catch (e) {
//       setError(e.message);
//     }
//   };

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
//             disabled={loading || !email || !password}
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
//           >
//             Resend code
//           </button>
//         </>
//       )}

//       {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
//     </AuthCard>
//   );
// }

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

//   // ===============================
//   // SIGN UP
//   // ===============================
//   const handleSignup = async () => {
//     if (!email || !password) return;

//     setLoading(true);
//     setError("");

//     try {
//       const { nextStep } = await signUp({
//         username: email,
//         password,
//         options: {
//           userAttributes: { email },
//         },
//       });

//       // 🔑 Cognito decides if confirmation is needed
//       if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
//         setStep("confirm");
//       } else {
//         // Auto-confirmed → sign in immediately
//         await signIn({ username: email, password });
//         await fetchAuthSession({ forceRefresh: true });
//         navigate("/auth/redirect", { replace: true });
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
//     if (!code) return;

//     setLoading(true);
//     setError("");

//     try {
//       await confirmSignUp({
//         username: email,
//         confirmationCode: code,
//       });

//       // Auto-login after verification
//       await signIn({ username: email, password });

//       // 🔥 CRITICAL: force token hydration
//       await fetchAuthSession({ forceRefresh: true });
//       navigate("/onboarding", { replace: true });
//       // navigate("/auth/redirect", { replace: true });
//     } catch (e) {
//       if (e.name === "CodeMismatchException") {
//         setError("Invalid verification code.");
//       } else if (e.name === "ExpiredCodeException") {
//         setError("Verification code expired. Please resend.");
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
//     setError("");
//     try {
//       await resendSignUpCode({ username: email });
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
//             disabled={loading || !email || !password}
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
import AuthCard from "../../components/auth/AuthCard";
import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
import AuthDivider from "../../components/auth/AuthDivider";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("signup"); // signup | confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Normalize once, reuse everywhere
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
        // Auto-confirmed users
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
        // Already confirmed → sign in safely
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
    <AuthCard
      title="Join QuickFix"
      subtitle="Find trusted service providers or offer your skills"
    >
      <SocialAuthButtons />
      <AuthDivider />

      {step === "signup" && (
        <>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input mt-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSignup}
            className="btn-primary mt-4"
            disabled={loading || !normalizedEmail || !password}
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </>
      )}

      {step === "confirm" && (
        <>
          <input
            className="input"
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button
            onClick={handleConfirm}
            className="btn-primary mt-4"
            disabled={loading || !code}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>

          <button
            onClick={handleResend}
            className="text-sm text-blue-500 mt-3"
            type="button"
            disabled={loading}
          >
            Resend code
          </button>
        </>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
      )}
    </AuthCard>
  );
}
