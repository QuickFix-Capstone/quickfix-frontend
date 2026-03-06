import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE as DEFAULT_API_BASE } from "./config";

const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

function parseJsonSafely(response) {
  return response.json().catch(() => ({}));
}

function classifyForbidden(result) {
  const text = `${result?.error || ""} ${result?.message || ""}`.toLowerCase();
  if (text.includes("verified")) return "not_verified";
  if (text.includes("owner") || text.includes("own") || text.includes("permission")) {
    return "ownership";
  }
  if (text.includes("serviceprovider") || text.includes("ServiceProvider")) {
    return "access_required";
  }
  return "forbidden";
}

function buildError(status, result) {
  const err = new Error(result?.error || result?.message || "Request failed");
  err.status = status;
  err.data = result;
  err.fieldErrors = result?.errors || result?.field_errors || null;
  if (status === 403) {
    err.reason = classifyForbidden(result);
  }
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

export async function getServiceOfferingById(service_offering_id, token) {
  const jwt = token || (await getAccessToken());

  const response = await fetch(
    `${API_BASE}/service-offerings/${service_offering_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildError(response.status, result);
  }

  return result;
}

export async function updateServiceOffering(service_offering_id, payload, token) {
  const jwt = token || (await getAccessToken());

  const response = await fetch(
    `${API_BASE}/service-offerings/${service_offering_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildError(response.status, result);
  }

  return result;
}

export async function deleteServiceOffering(offering_id, token) {
  const jwt = token || (await getAccessToken());

  const response = await fetch(
    `${API_BASE}/serivce-offerings/remove/${offering_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  const result = await parseJsonSafely(response);

  if (!response.ok) {
    throw buildError(response.status, result);
  }

  return result;
}
