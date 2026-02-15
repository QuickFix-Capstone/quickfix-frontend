import { API_BASE } from "./config";

/**
 * Get the authentication token from OIDC localStorage
 * @returns {string} JWT ID token
 * @throws {Error} If user is not authenticated
 */
function getAuthToken() {
  const userKey = `oidc.user:https://cognito-idp.us-east-2.amazonaws.com/us-east-2_45z5OMePi:p2u5qdegml3hp60n6ohu52n2b`;
  const userDataString = localStorage.getItem(userKey);

  if (!userDataString) {
    throw new Error("User not authenticated - no OIDC session found");
  }

  try {
    const userData = JSON.parse(userDataString);
    const token = userData.id_token;

    if (!token) {
      throw new Error("User not authenticated - no ID token found");
    }

    return token;
  } catch {
    throw new Error("Failed to parse authentication data");
  }
}

/**
 * Get reviews that providers have written about the authenticated customer
 * @param {number} limit - Maximum number of reviews to return
 * @returns {Promise<Object>} Object containing reviews array
 */
export async function getReviewsAboutMe(limit = 20) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/customer/reviews-about-me?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch reviews about you");
  }

  return data;
}
