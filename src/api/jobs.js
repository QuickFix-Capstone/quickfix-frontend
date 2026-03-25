import { API_BASE } from "./config";

const getAuthToken = (auth) => auth.user?.id_token || auth.user?.access_token;

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

const normalizeOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

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

export const createJob = async (auth, payload) => {
  const token = getAuthToken(auth);
  const locationLat = normalizeOptionalNumber(payload?.location_lat);
  const locationLng = normalizeOptionalNumber(payload?.location_lng);
  const hasCoordinatePair =
    locationLat !== null &&
    locationLng !== null;

  if (!token) {
    throw new Error("Authentication required. Please sign in again.");
  }

  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: String(payload?.title ?? "").trim(),
      description: String(payload?.description ?? "").trim(),
      location_address: String(payload?.location_address ?? "").trim(),
      category: normalizeOptionalString(payload?.category),
      location_city: normalizeOptionalString(payload?.location_city),
      location_state: normalizeOptionalString(payload?.location_state),
      location_zip: normalizeOptionalString(payload?.location_zip),
      location_lat: hasCoordinatePair ? locationLat : null,
      location_lng: hasCoordinatePair ? locationLng : null,
      preferred_date: normalizeOptionalString(payload?.preferred_date),
      preferred_time: normalizeOptionalString(payload?.preferred_time),
      budget_min: normalizeOptionalNumber(payload?.budget_min),
      budget_max: normalizeOptionalNumber(payload?.budget_max),
    }),
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(
      response,
      "Failed to create job. Please try again."
    );
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data?.job ?? data;
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

export const confirmJobComplete = async (jobId, auth) => {
  const token = getAuthToken(auth);

  if (!token) {
    throw new Error("Authentication required. Please sign in again.");
  }
  if (!jobId) {
    throw new Error("Missing job ID.");
  }

  const response = await fetch(`${API_BASE}/jobs/${jobId}/confirm-complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(
      response,
      "Failed to complete job. Please try again."
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
