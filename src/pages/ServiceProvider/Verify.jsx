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
    <div>
      <h2>Verify your email</h2>
      <p>Enter the code sent to {email}</p>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Verification code"
      />

      <button onClick={handleVerify} disabled={loading}>
        Verify
      </button>

      <button onClick={resendCode}>Resend code</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
