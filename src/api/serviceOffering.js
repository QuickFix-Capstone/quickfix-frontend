import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "./config";

const OFFERINGS_PATH = `${API_BASE}/service-offerings`;

function getBearerToken(session) {
  return (
    session?.tokens?.idToken?.toString() ||
    session?.tokens?.accessToken?.toString() ||
    null
  );
}

async function getAuthHeaders() {
  const session = await fetchAuthSession();
  const token = getBearerToken(session);

  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function pickErrorMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  return data.message || data.error || data.detail || "";
}

function mapApiErrorMessage(status, data) {
  const rawMessage = pickErrorMessage(data);
  const lower = `${rawMessage} ${JSON.stringify(data || {})}`.toLowerCase();

  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }

  if (status === 403) {
    if (lower.includes("verified")) {
      return "Verification required. Complete provider verification to edit offerings.";
    }
    if (lower.includes("profile") || lower.includes("provider")) {
      return "Finish setting up your provider profile before editing offerings.";
    }
    if (lower.includes("serviceprovider") || lower.includes("service provider")) {
      return "Provider access only.";
    }
    return "You do not have permission to edit this offering.";
  }

  if (status === 404) {
    return "This offering no longer exists.";
  }

  if (status === 400) {
    return rawMessage || "Please correct the highlighted fields.";
  }

  if (status >= 500) {
    return "Something went wrong. Please try again.";
  }

  return rawMessage || "Request failed.";
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    const error = new Error(mapApiErrorMessage(res.status, data));
    error.status = res.status;
    error.data = data;
    error.fieldErrors = data?.errors || data?.field_errors || null;
    throw error;
  }

  return data;
}

export async function createServiceOffering(payload) {
  return request(OFFERINGS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const serviceOfferingsApi = {
  async listMine() {
    return request(OFFERINGS_PATH);
  },

  async getByOfferingId(offering_id) {
    return request(`${OFFERINGS_PATH}/${offering_id}`);
  },

  async update(offeringId, payload) {
    return request(`${OFFERINGS_PATH}/${offeringId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

export async function updateServiceOffering(offeringId, payload) {
  return serviceOfferingsApi.update(offeringId, payload);
}

export async function getServiceOfferingById(offering_id) {
  return serviceOfferingsApi.getByOfferingId(offering_id);
}
