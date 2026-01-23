import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmSignIn } from "aws-amplify/auth";

export default function AdminSetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username;

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirmSignIn({ challengeResponse: newPassword });
      navigate("/admin/login");
    } catch (err) {
      setError(err.message || "Password setup failed");
    } finally {
      setLoading(false);
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid flow. Please go back to Admin Login.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
      <form
        onSubmit={handleSetPassword}
        className="bg-gray-950 p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-800"
      >
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Set Admin Password
        </h1>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="w-full mb-6 p-3 rounded bg-gray-800 text-white border border-gray-700"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          {loading ? "Saving..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
