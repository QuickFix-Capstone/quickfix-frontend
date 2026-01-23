import { useState } from "react";
import { useAuth } from "react-oidc-context";

export default function SystemHealthDiagnostic() {
  const auth = useAuth();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [tokenSource, setTokenSource] = useState("");

  const getAuthToken = () => {
    // Try ID token first (has groups claim)
    if (auth?.user?.id_token) {
      console.log("✅ Token from auth.user.id_token");
      setTokenSource("auth.user.id_token");
      return auth.user.id_token;
    }

    // Try access token as fallback
    if (auth?.user?.access_token) {
      console.log("⚠️ Token from auth.user.access_token (may not have groups)");
      setTokenSource("auth.user.access_token");
      return auth.user.access_token;
    }

    // Try OIDC storage (prefer ID token)
    if (auth?.settings?.authority && auth?.settings?.client_id) {
      const stored = localStorage.getItem(
        `oidc.user:${auth.settings.authority}:${auth.settings.client_id}`,
      );
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.id_token) {
            console.log("✅ Token from oidc.user storage (id_token)");
            setTokenSource("oidc.user storage (id_token)");
            return parsed.id_token;
          }
          if (parsed.access_token) {
            console.log("⚠️ Token from oidc.user storage (access_token)");
            setTokenSource("oidc.user storage (access_token)");
            return parsed.access_token;
          }
        } catch (e) {
          console.error("Failed to parse oidc.user storage:", e);
        }
      }
    }

    // Try Cognito storage (prefer idToken)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.includes("CognitoIdentityServiceProvider") &&
        key?.includes("idToken")
      ) {
        const token = localStorage.getItem(key);
        if (token && token.length > 100) {
          console.log("✅ Token from Cognito storage (idToken):", key);
          setTokenSource(`Cognito idToken: ${key.split(".").pop()}`);
          return token;
        }
      }
    }

    // Last resort: access token from Cognito
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.includes("CognitoIdentityServiceProvider") &&
        key?.includes("accessToken")
      ) {
        const token = localStorage.getItem(key);
        if (token && token.length > 100) {
          console.log("⚠️ Token from Cognito storage (accessToken):", key);
          setTokenSource(`Cognito accessToken: ${key.split(".").pop()}`);
          return token;
        }
      }
    }

    return null;
  };

  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        sub: payload.sub,
        email: payload.email,
        groups: payload["cognito:groups"] || [],
        exp: payload.exp,
        iat: payload.iat,
        token_use: payload.token_use,
        allClaims: payload,
      };
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  };

  const testEndpoint = async () => {
    setLoading(true);
    setResponse(null);

    const token = getAuthToken();

    if (!token) {
      setResponse({
        error: true,
        message: "No token found",
        details: "Could not retrieve authentication token from storage",
      });
      setLoading(false);
      return;
    }

    const tokenInfo = decodeToken(token);
    setDebugInfo(tokenInfo);

    console.log("=".repeat(50));
    console.log("🔍 FULL DIAGNOSTIC");
    console.log("=".repeat(50));
    console.log("Token Info:", tokenInfo);
    console.log("Token Use:", tokenInfo?.token_use);
    console.log("Groups:", tokenInfo?.groups);
    console.log("Token Length:", token.length);
    console.log("Token Preview:", token.substring(0, 50) + "...");
    console.log("Token Source:", tokenSource);
    console.log("=".repeat(50));

    try {
      const url =
        "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/monitoring_system";

      console.log("📡 Making request to:", url);
      console.log(
        "📡 Authorization header:",
        `Bearer ${token.substring(0, 50)}...`,
      );

      const startTime = Date.now();
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const endTime = Date.now();

      console.log("📡 Response Status:", res.status);
      console.log("📡 Response Time:", endTime - startTime, "ms");
      console.log(
        "📡 Response Headers:",
        Object.fromEntries(res.headers.entries()),
      );

      let responseBody;
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      console.log("📡 Response Body:", responseBody);

      setResponse({
        error: !res.ok,
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        requestTime: endTime - startTime,
      });
    } catch (err) {
      console.error("❌ Request failed:", err);
      setResponse({
        error: true,
        message: err.message,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  const tokenUseStatus = debugInfo?.token_use === "id" ? "✅" : "⚠️";
  const groupsStatus = debugInfo?.groups?.includes("Administrator")
    ? "✅"
    : "❌";
  const expiryStatus =
    debugInfo?.exp && debugInfo.exp * 1000 > Date.now() ? "✅" : "❌";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          🔧 System Health - Diagnostic Mode
        </h1>
        <p className="text-gray-600 mb-4">
          This page tests the health monitoring endpoint with full debugging
          output
        </p>

        <button
          onClick={testEndpoint}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "🔄 Testing..." : "🚀 Test Health Endpoint"}
        </button>
      </div>

      {debugInfo && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center gap-2">
            🎫 Token Information
          </h3>
          <div className="bg-white rounded p-4 space-y-2 text-sm font-mono">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Token Source:</span>
              <span className="text-blue-700">{tokenSource}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">User ID:</span>
              <span className="text-gray-800">{debugInfo.sub}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Email:</span>
              <span className="text-gray-800">{debugInfo.email || "N/A"}</span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Token Use:</span>
              <span
                className={
                  debugInfo.token_use === "id"
                    ? "text-green-600 font-bold"
                    : "text-orange-600 font-bold"
                }
              >
                {tokenUseStatus} {debugInfo.token_use}
              </span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Groups:</span>
              <span
                className={
                  debugInfo.groups?.length > 0
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {groupsStatus} {JSON.stringify(debugInfo.groups)}
              </span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Issued At:</span>
              <span className="text-gray-800">
                {new Date(debugInfo.iat * 1000).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">Expires At:</span>
              <span className="text-gray-800">
                {new Date(debugInfo.exp * 1000).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-gray-600 font-semibold">
                Time Remaining:
              </span>
              <span
                className={
                  expiryStatus === "✅" ? "text-green-600" : "text-red-600"
                }
              >
                {expiryStatus}{" "}
                {Math.floor((debugInfo.exp * 1000 - Date.now()) / 1000 / 60)}{" "}
                minutes
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
            <div className="text-sm space-y-1">
              <p className="font-semibold text-blue-900">
                ✅ Pre-flight Checks:
              </p>
              <p className="flex items-center gap-2">
                {tokenUseStatus}
                <span>
                  Token type is <strong>{debugInfo.token_use}</strong>{" "}
                  {debugInfo.token_use === "id"
                    ? "(correct)"
                    : "(may not work - need ID token)"}
                </span>
              </p>
              <p className="flex items-center gap-2">
                {groupsStatus}
                <span>
                  Administrator group{" "}
                  {debugInfo.groups?.includes("Administrator")
                    ? "found"
                    : "NOT FOUND"}
                </span>
              </p>
              <p className="flex items-center gap-2">
                {expiryStatus}
                <span>Token {expiryStatus === "✅" ? "valid" : "EXPIRED"}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {response && (
        <div
          className={`border-2 rounded-lg p-5 shadow-sm ${response.error ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"}`}
        >
          <h3
            className={`font-bold mb-3 text-lg flex items-center gap-2 ${response.error ? "text-red-900" : "text-green-900"}`}
          >
            {response.error ? "❌ Request Failed" : "✅ Request Successful"}
          </h3>

          {response.status && (
            <div className="bg-white rounded p-4 space-y-3 text-sm font-mono">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-gray-600 font-semibold">Status:</span>
                <span
                  className={`font-bold ${
                    response.status === 200 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-gray-600 font-semibold">
                  Request Time:
                </span>
                <span className="text-gray-800">{response.requestTime}ms</span>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer font-bold text-gray-700 hover:text-gray-900">
                  📋 Response Headers
                </summary>
                <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-auto border border-gray-200">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </details>

              <details className="mt-3" open>
                <summary className="cursor-pointer font-bold text-gray-700 hover:text-gray-900">
                  📦 Response Body
                </summary>
                <pre className="bg-gray-50 p-3 rounded mt-2 text-xs overflow-auto max-h-96 border border-gray-200">
                  {typeof response.body === "string"
                    ? response.body
                    : JSON.stringify(response.body, null, 2)}
                </pre>
              </details>

              {response.body?.debug && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                  <p className="font-bold text-yellow-900 mb-2">
                    🔍 Debug Info from Lambda:
                  </p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(response.body.debug, null, 2)}
                  </pre>
                  {response.body.debug.found_groups && (
                    <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded">
                      <p className="font-bold text-orange-900 text-sm mb-1">
                        ⚠️ Groups Format Issue Detected:
                      </p>
                      <p className="text-xs text-orange-800">
                        Lambda received:{" "}
                        <code className="bg-white px-1 rounded">
                          {JSON.stringify(response.body.debug.found_groups)}
                        </code>
                      </p>
                      <p className="text-xs text-orange-800 mt-1">
                        This looks like a string with brackets instead of a
                        proper array. The Lambda should strip these brackets.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {response.message && !response.status && (
            <div className="mt-3 bg-white rounded p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Error Message:
              </p>
              <pre className="bg-gray-50 p-3 rounded text-xs border border-gray-200">
                {response.message}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 shadow-sm">
        <h3 className="font-bold text-yellow-900 mb-3 text-lg">
          ⚠️ Common Issues
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">1.</span>
            <div>
              <strong>Using Access Token instead of ID Token:</strong>
              <p className="text-gray-700 mt-1">
                Access tokens may not contain the{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  cognito:groups
                </code>{" "}
                claim. Always use ID tokens for group-based authorization.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">2.</span>
            <div>
              <strong>Groups Coming as String "[Administrator]":</strong>
              <p className="text-gray-700 mt-1">
                API Gateway HTTP API sometimes passes arrays as bracket-wrapped
                strings. Lambda must strip brackets:{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  [Administrator]
                </code>{" "}
                →{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  Administrator
                </code>
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">3.</span>
            <div>
              <strong>API Gateway Authorizer Not Configured:</strong>
              <p className="text-gray-700 mt-1">
                The JWT authorizer must be attached to the route and configured
                with the correct Cognito User Pool.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 font-bold mt-0.5">4.</span>
            <div>
              <strong>Case-Sensitive Group Name:</strong>
              <p className="text-gray-700 mt-1">
                The group name must be exactly{" "}
                <code className="bg-yellow-100 px-1 rounded">
                  Administrator
                </code>{" "}
                (capital A, no brackets)
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">
          🔧 Troubleshooting Steps
        </h3>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5 min-w-[20px]">
              1.
            </span>
            <div>
              <strong>Check Token Type Above:</strong>
              <p className="text-gray-700 mt-1">
                Should say "id" not "access". If it says "access", the frontend
                is sending the wrong token.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5 min-w-[20px]">
              2.
            </span>
            <div>
              <strong>Verify Groups Claim:</strong>
              <p className="text-gray-700 mt-1">
                Should show{" "}
                <code className="bg-gray-100 px-1 rounded">
                  ["Administrator"]
                </code>{" "}
                above. If empty, user isn't in the group.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5 min-w-[20px]">
              3.
            </span>
            <div>
              <strong>Check Lambda Debug Info:</strong>
              <p className="text-gray-700 mt-1">
                Look at the yellow "Debug Info from Lambda" box above. It shows
                what groups the Lambda received. If it shows{" "}
                <code className="bg-gray-100 px-1 rounded">
                  ["[Administrator]"]
                </code>{" "}
                with extra brackets, the Lambda needs the bracket-stripping fix.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5 min-w-[20px]">
              4.
            </span>
            <div>
              <strong>Check Lambda CloudWatch Logs:</strong>
              <p className="text-gray-700 mt-1">
                Go to CloudWatch → Log groups →{" "}
                <code className="bg-gray-100 px-1 rounded">
                  /aws/lambda/monitoring_system
                </code>
              </p>
              <p className="text-gray-700 mt-1">
                Look for the debug output showing what claims were received.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
