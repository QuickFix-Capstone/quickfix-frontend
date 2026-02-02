import { API_BASE } from "../api/config.js";

/**
 * Extract Cognito ID token from localStorage
 */
function getCognitoIdToken() {
  const prefix = "CognitoIdentityServiceProvider.";

  // Find the idToken key dynamically
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix) && key.endsWith(".idToken")) {
      return localStorage.getItem(key);
    }
  }

  throw new Error("Cognito ID token not found");
}

export async function fetchSystemHealth() {
  const idToken = getCognitoIdToken();

  const res = await fetch(`${API_BASE}/monitoring_system`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch system health (${res.status})`);
  }

  return res.json();
}
