import { API_BASE } from "./config";

/**
 * Get the authentication token from OIDC localStorage
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
 * Get reviews that providers have left about the authenticated customer
 * @param {Object} params
 * @param {string} params.sort - Sort order: "newest" | "oldest" | "highest_rating" | "lowest_rating"
 * @param {number} params.limit - Max reviews to return
 * @param {number} params.offset - Pagination offset
 * @returns {Promise<Object>} { reviews: [], customer: {} }
 */
export async function getReviewsAboutMe({ sort = "newest", limit = 20, offset = 0 } = {}) {
    const token = getAuthToken();

    const params = new URLSearchParams({ sort, limit, offset });
    const res = await fetch(`${API_BASE}/customer/reviews-about-me?${params}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch reviews about me");
    }

    return data;
}
