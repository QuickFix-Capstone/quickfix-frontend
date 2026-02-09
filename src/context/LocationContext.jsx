import { createContext, useContext, useState, useCallback } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const parseAddress = (data) => {
    const addr = data?.address || {};
    const line1Parts = [addr.house_number, addr.road].filter(Boolean);
    const addressLine = line1Parts.join(" ").trim();
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.hamlet ||
      addr.county ||
      "";
    const province = addr.state || addr.region || "";
    const postalCode = addr.postcode || "";

    return {
      address_line: addressLine,
      city,
      province,
      postal_code: postalCode,
      country: addr.country || "",
      formatted: data?.display_name || "",
    };
  };

  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      setAddressLoading(true);
      setAddressError(null);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      );

      if (!res.ok) {
        throw new Error("Failed to reverse geocode location");
      }

      const data = await res.json();
      setAddress(parseAddress(data));
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setAddressError(
        err?.message || "Unable to retrieve address from location",
      );
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({ latitude, longitude });
        setLoading(false);
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied"
            : "Unable to retrieve location",
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        getLocation,
        loading,
        error,
        address,
        addressLoading,
        addressError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
};
