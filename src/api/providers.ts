import { API_BASE } from "./config";

export async function getProviderPublicProfile(
  providerId: string,
  page = 1,
  limit = 10
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_BASE}/providers/${encodeURIComponent(providerId)}?${query.toString()}`
  );

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error: any = new Error(
      response.status === 404
        ? "Provider not found"
        : response.status >= 500
          ? "Something went wrong"
          : payload?.message || "Failed to load provider profile"
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return {
    provider: payload?.provider || {},
    stats: payload?.stats || {},
    service_offerings: payload?.service_offerings || [],
    reviews: {
      items: payload?.reviews?.items || [],
      page: payload?.reviews?.page ?? page,
      limit: payload?.reviews?.limit ?? limit,
      total: payload?.reviews?.total ?? 0,
      total_pages: payload?.reviews?.total_pages ?? 1,
      has_next: Boolean(payload?.reviews?.has_next),
      has_prev: Boolean(payload?.reviews?.has_prev),
    },
    badges: payload?.badges || [],
  };
}
