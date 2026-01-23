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
  } catch (error) {
    throw new Error("Failed to parse authentication data");
  }
}

/**
 * Create a new customer review for a completed booking or job
 * @param {Object} params - Review parameters
 * @param {string} params.booking_id - The booking ID (optional, either booking_id or job_id required)
 * @param {string} params.job_id - The job ID (optional, either booking_id or job_id required)
 * @param {string} params.provider_id - The provider being reviewed
 * @param {number} params.rating - Star rating (1-5)
 * @param {string} params.comment - Optional review text
 * @returns {Promise<Object>} Created review object
 */
export async function createCustomerReview({ booking_id, job_id, provider_id, rating, comment = "" }) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/customer/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: booking_id || null,
      job_id: job_id || null,
      provider_id,
      rating,
      comment: comment.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create review");
  }

  return data;
}

/**
 * Get all reviews created by the authenticated customer
 * @param {number} limit - Maximum number of reviews to return
 * @returns {Promise<Object>} Object containing reviews array
 */
export async function getMyReviews(limit = 20) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/customer/reviews?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch reviews");
  }

  return data;
}

/**
 * Get reviews for a specific provider
 * @param {string} providerId - The provider ID
 * @param {number} limit - Maximum number of reviews to return
 * @returns {Promise<Object>} Object containing reviews array
 */
export async function getProviderReviews(providerId, limit = 20) {
  const token = getAuthToken();

  const res = await fetch(
    `${API_BASE}/provider/${providerId}/reviews?limit=${limit}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch provider reviews");
  }

  return data;
}

/**
 * Update an existing review
 * @param {string} reviewId - The review ID
 * @param {number} rating - Updated star rating (1-5)
 * @param {string} comment - Updated review text
 * @returns {Promise<Object>} Updated review object
 */
export async function updateReview(reviewId, rating, comment = "") {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rating,
      comment: comment.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update review");
  }

  return data;
}

/**
 * Delete a review
 * @param {string} reviewId - The review ID
 * @returns {Promise<Object>} Success message
 */
export async function deleteReview(reviewId) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to delete review");
  }

  return data;
}
