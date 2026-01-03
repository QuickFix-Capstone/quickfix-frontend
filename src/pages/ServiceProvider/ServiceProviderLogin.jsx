// import { signIn } from "aws-amplify/auth";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthCard from "../../components/auth/AuthCard";
// import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
// import AuthDivider from "../../components/auth/AuthDivider";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     try {
//       await signIn({ username: email, password });
//       navigate("/auth/redirect", { replace: true });
//     } catch (e) {
//       setError(e.message);
//     }
//   };

//   return (
//     <AuthCard title="Sign in to QuickFix">
//       <SocialAuthButtons />
//       <AuthDivider />

//       <input
//         className="input"
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//       />
//       <input
//         className="input mt-3"
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <button onClick={handleLogin} className="btn-primary mt-4">
//         Continue
//       </button>

//       {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
//     </AuthCard>
//   );
// }


import { signIn } from "aws-amplify/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
import AuthDivider from "../../components/auth/AuthDivider";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      await signIn({ username: email, password });
      navigate("/auth/redirect", { replace: true });
    } catch (e) {
      setError(e.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthCard
          title="Sign in to QuickFix"
          subtitle="Welcome back — let’s get you working"
        >
          {/* Social Login */}
          <SocialAuthButtons />
          <AuthDivider />

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm sm:text-base text-neutral-600">
              Email
            </label>
            <input
              className="input h-11 sm:h-12"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-1 mt-4">
            <label className="text-sm sm:text-base text-neutral-600">
              Password
            </label>

            <div className="relative">
              <input
                className="input pr-12 h-11 sm:h-12"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm sm:text-base text-neutral-500 hover:text-black"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary mt-6 w-full h-11 sm:h-12 text-base"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-sm sm:text-base text-neutral-600">
            Don’t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-black hover:underline"
            >
              Sign up
            </a>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}
