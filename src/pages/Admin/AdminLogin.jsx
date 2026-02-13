//

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, fetchAuthSession, signOut } from "aws-amplify/auth";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn({
        username: email,
        password,
      });

      // 🔁 Forced password change
      if (
        result?.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        navigate("/admin/set-password", { state: { username: email } });
        return;
      }

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (!idToken) {
        throw new Error("Authentication failed");
      }

      const claims = idToken.payload;
      const groups = claims["cognito:groups"] || claims["groups"] || [];

      // 🔐 Enforce admin role
      if (!groups.includes("Administrator")) {
        await signOut();
        throw new Error("Admins only");
      }

      // ✅ Optional: store display info ONLY
      localStorage.setItem(
        "adminProfile",
        JSON.stringify({
          sub: claims.sub,
          email: claims.email,
          exp: claims.exp,
        }),
      );

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Admin Login
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Admin Email"
          className="w-full mb-4 p-3 rounded bg-gray-800 text-white border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded bg-gray-800 text-white border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          {loading ? "Authenticating..." : "Login as Admin"}
        </button>
      </form>
    </div>
  );
}
