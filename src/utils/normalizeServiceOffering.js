const ALLOWED_FIELDS = new Set([
  "title",
  "description",
  "category",
  "price",
  "pricing_type",
  "main_image_url",
  "is_active",
  "latitude",
  "longitude",
  "service_radius_km",
]);

function shouldIncludeField(field, dirtyFields) {
  if (!dirtyFields) return true;
  return Boolean(dirtyFields[field]);
}

export function normalizeServiceOffering(formData, dirtyFields = null) {
  const payload = {};

  if (shouldIncludeField("title", dirtyFields) && formData.title?.trim()) {
    payload.title = formData.title.trim();
  }

  if (
    shouldIncludeField("description", dirtyFields) &&
    formData.description?.trim()
  ) {
    payload.description = formData.description.trim();
  }

  if (shouldIncludeField("category", dirtyFields) && formData.category) {
    payload.category = formData.category.toUpperCase();
  }

  if (
    shouldIncludeField("pricing_type", dirtyFields) &&
    formData.pricing_type
  ) {
    payload.pricing_type = formData.pricing_type.toUpperCase();
  }

  if (
    shouldIncludeField("price", dirtyFields) &&
    formData.price !== "" &&
    formData.price !== null &&
    formData.price !== undefined
  ) {
    const price = Number(formData.price);
    if (Number.isFinite(price)) {
      payload.price = price;
    }
  }

  if (
    shouldIncludeField("main_image_url", dirtyFields) &&
    formData.main_image_url?.trim()
  ) {
    payload.main_image_url = formData.main_image_url.trim();
  }

  // Guard against undefined so a missing is_active doesn't silently send false
  if (
    shouldIncludeField("is_active", dirtyFields) &&
    formData.is_active !== undefined
  ) {
    payload.is_active = Boolean(formData.is_active);
  }

  if (
    shouldIncludeField("latitude", dirtyFields) &&
    formData.latitude !== "" &&
    formData.latitude !== null &&
    formData.latitude !== undefined
  ) {
    const latitude = Number(formData.latitude);
    if (Number.isFinite(latitude)) {
      payload.latitude = latitude;
    }
  }

  if (
    shouldIncludeField("longitude", dirtyFields) &&
    formData.longitude !== "" &&
    formData.longitude !== null &&
    formData.longitude !== undefined
  ) {
    const longitude = Number(formData.longitude);
    if (Number.isFinite(longitude)) {
      payload.longitude = longitude;
    }
  }

  if (
    shouldIncludeField("service_radius_km", dirtyFields) &&
    formData.service_radius_km !== "" &&
    formData.service_radius_km !== null &&
    formData.service_radius_km !== undefined
  ) {
    const serviceRadius = Number(formData.service_radius_km);
    if (Number.isFinite(serviceRadius)) {
      payload.service_radius_km = serviceRadius;
    }
  }

  return payload;
}