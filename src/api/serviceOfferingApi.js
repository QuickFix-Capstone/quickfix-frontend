import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE as DEFAULT_API_BASE } from "./config";

const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

function parseJsonSafely(response) {
  return response.json().catch(() => ({}));
}

function buildError(status, result) {
  const err = new Error(result?.error || result?.message || "Request failed");
  err.status = status;
  err.data = result;
  err.fieldErrors = result?.errors || result?.field_errors || null;
  return err;
}

export async function getAccessToken() {
  const session = await fetchAuthSession();
  const token =
    session?.tokens?.idToken?.toString() ||
    session?.tokens?.accessToken?.toString();

  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }

  return token;
}

export async function getServiceOffering(offering_id, token) {
  const jwt = token || (await getAccessToken());

  const response = await fetch(`${API_BASE}/service-offerings/${offering_id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildError(response.status, result);
  }

  return result;
}

export async function updateServiceOffering(offeringId, data, token) {
  const jwt = token || (await getAccessToken());
  const payload = {};

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "price") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      payload.price = numeric;
      return;
    }
    if (key === "is_active") {
      payload.is_active = Boolean(value);
      return;
    }
    payload[key] = value;
  });

  if (Object.keys(payload).length === 0) {
    const err = new Error("Nothing to update.");
    err.status = 400;
    throw err;
  }

  const response = await fetch(`${API_BASE}/service-offerings/${offeringId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildError(response.status, result);
  }

  return result;
}
