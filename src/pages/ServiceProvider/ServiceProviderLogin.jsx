// import { signIn } from "aws-amplify/auth";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthCard from "../../components/auth/AuthCard";
// import SocialAuthButtons from "../../components/auth/SocialAuthButtons";
// import AuthDivider from "../../components/auth/AuthDivider";

// export default function Login() {
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       setError("Please enter your email and password");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       await signIn({ username: email, password });

//       navigate("/service-provider/dashboard", { replace: true });
//     } catch (e) {
//       const message =
//         e.name === "NotAuthorizedException"
//           ? "Incorrect email or password"
//           : e.name === "UserNotConfirmedException"
//             ? "Please confirm your email before signing in"
//             : e.message || "Failed to sign in";

//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
//       <div className="w-full max-w-md">
//         <AuthCard
//           title="Welcome back"
//           subtitle="Sign in to continue to your QuickFix account"
//         >
//           {/* Email */}
//           <div className="space-y-1">
//             <label className="text-sm sm:text-base text-neutral-600">
//               Email address
//             </label>
//             <input
//               autoFocus
//               className="input h-11 sm:h-12"
//               type="email"
//               placeholder="you@example.com"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </div>

//           {/* Password */}
//           <div className="space-y-1 mt-4">
//             <label className="text-sm sm:text-base text-neutral-600">
//               Password
//             </label>

//             <div className="relative">
//               <input
//                 className="input pr-12 h-11 sm:h-12"
//                 type={showPassword ? "text" : "password"}
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />

//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-sm sm:text-base text-neutral-500 hover:text-black"
//               >
//                 {showPassword ? "Hide" : "Show"}
//               </button>
//             </div>

//             {/* Forgot Password */}
//             <p className="mt-2 text-right text-sm">
//               <a
//                 href="/forgot-password"
//                 className="text-neutral-600 hover:text-black hover:underline"
//               >
//                 Forgot password?
//               </a>
//             </p>
//           </div>

//           {/* CTA */}
//           <button
//             onClick={handleLogin}
//             disabled={loading}
//             className={`btn-primary mt-6 w-full h-11 sm:h-12 text-base ${
//               loading ? "opacity-60 cursor-not-allowed" : ""
//             }`}
//           >
//             {loading ? "Signing in..." : "Sign in"}
//           </button>

//           {/* Error */}
//           {error && (
//             <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
//               {error}
//             </div>
//           )}

//           {/* Divider */}
//           <AuthDivider text="or sign in with" />

//           {/* Social Login */}
//           <SocialAuthButtons />

//           {/* Footer */}
//           <p className="mt-6 text-center text-sm text-neutral-500">
//             New to QuickFix?{" "}
//             <a href="/signup" className="underline hover:text-black">
//               Create an account
//             </a>
//           </p>
//         </AuthCard>
//       </div>
//     </div>
//   );
// }



import { signIn, fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
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

  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Sign in the user
      await signIn({ username: email, password });

      // Fetch authentication session (tokens)
      const session = await fetchAuthSession();
      
      // Fetch user attributes
      const userAttributes = await fetchUserAttributes();

      // Extract tokens
      const accessToken = session.tokens?.accessToken?.toString();
      const idToken = session.tokens?.idToken?.toString();
      const refreshToken = session.tokens?.refreshToken?.toString();

      // Decode ID token to get user groups and other claims
      const decodedIdToken = idToken ? decodeToken(idToken) : null;
      const userGroups = decodedIdToken?.['cognito:groups'] || [];

      // Create user data object
      const userData = {
        email: userAttributes.email,
        sub: userAttributes.sub,
        emailVerified: userAttributes.email_verified,
        userGroups: userGroups,
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
        decodedToken: decodedIdToken,
        allAttributes: userAttributes,
        loginTime: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('quickfix_user', JSON.stringify(userData));
      localStorage.setItem('quickfix_access_token', accessToken);
      localStorage.setItem('quickfix_id_token', idToken);
      localStorage.setItem('quickfix_user_groups', JSON.stringify(userGroups));

      navigate("/service-provider/dashboard", { replace: true });
    } catch (e) {
      const message =
        e.name === "NotAuthorizedException"
          ? "Incorrect email or password"
          : e.name === "UserNotConfirmedException"
            ? "Please confirm your email before signing in"
            : e.message || "Failed to sign in";

      setError(message);
      console.error("Login error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to continue to your QuickFix account"
        >
          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm sm:text-base text-neutral-600">
              Email address
            </label>
            <input
              autoFocus
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

            {/* Forgot Password */}
            <p className="mt-2 text-right text-sm">
              <a
                href="/forgot-password"
                className="text-neutral-600 hover:text-black hover:underline"
              >
                Forgot password?
              </a>
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`btn-primary mt-6 w-full h-11 sm:h-12 text-base ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Divider */}
          <AuthDivider text="or sign in with" />

          {/* Social Login */}
          <SocialAuthButtons />

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            New to QuickFix?{" "}
            <a href="/signup" className="underline hover:text-black">
              Create an account
            </a>
          </p>
        </AuthCard>
      </div>
    </div>
  );
}