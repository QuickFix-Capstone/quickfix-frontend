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
