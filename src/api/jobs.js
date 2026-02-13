import { API_BASE } from "./config";

const getAuthToken = (auth) => auth.user?.id_token || auth.user?.access_token;

const parseErrorMessage = async (response, fallback) => {
  try {
    const text = await response.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      return data?.message || fallback;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
};

export const cancelJob = async (jobId, auth) => {
  const token = getAuthToken(auth);
  const response = await fetch(`${API_BASE}/job/${jobId}/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(
      response,
      "Failed to cancel job. Please try again."
    );
    throw new Error(errorMessage);
  }

  return response.json();
};

export const updateJobApplicationStatus = async (
  jobId,
  applicationId,
  action,
  auth
) => {
  const token = getAuthToken(auth);
  const normalizedAction = String(action || "").toLowerCase();

  if (!token) {
    throw new Error("Authentication required. Please sign in again.");
  }
  if (!jobId || !applicationId) {
    throw new Error("Missing job or application ID.");
  }
  if (!["accept", "reject"].includes(normalizedAction)) {
    throw new Error("Invalid application action.");
  }

  const response = await fetch(
    `${API_BASE}/job/${jobId}/applications/${applicationId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: normalizedAction }),
    }
  );

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(
      response,
      "Failed to update application. Please try again."
    );
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

export const updateJobApplicationDetails = async (
  jobId,
  applicationId,
  details,
  auth
) => {
  const token = getAuthToken(auth);
  const parsedPrice = Number(details?.proposed_price);
  const trimmedMessage = String(
    details?.message ?? details?.cover_letter ?? ""
  ).trim();

  if (!token) {
    throw new Error("Authentication required. Please sign in again.");
  }
  if (!jobId || !applicationId) {
    throw new Error("Missing job or application ID.");
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    throw new Error("Please enter a valid proposed price.");
  }
  if (!trimmedMessage) {
    throw new Error("Please enter application details.");
  }

  const response = await fetch(
    `${API_BASE}/job/${jobId}/applications/${applicationId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposed_price: parsedPrice,
        message: trimmedMessage,
      }),
    }
  );

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(
      response,
      "Failed to update application details. Please try again."
    );
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};
