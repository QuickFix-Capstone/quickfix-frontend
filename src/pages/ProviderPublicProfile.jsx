import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getProviderPublicProfile } from "../api/providers";
import BadgeChips from "../components/provider/BadgeChips";
import ProviderHeader from "../components/provider/ProviderHeader";
import RatingDistribution from "../components/provider/RatingDistribution";
import ReviewsList from "../components/provider/ReviewsList";
import ServiceOfferingGrid from "../components/provider/ServiceOfferingGrid";
import SkeletonLoader from "../components/provider/SkeletonLoader";
import { safeText } from "../utils/format";

const DEFAULT_LIMIT = 10;

function ErrorState({ status }) {
  const message =
    status === 404
      ? "This provider is not available."
      : "Couldn't load profile. Try again.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">{message}</h1>
      </div>
    </div>
  );
}

function QuickStats({ servicesCount, reviewCount, avgRating }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Quick Stats</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-lg font-bold text-neutral-900">{servicesCount}</p>
          <p className="text-xs text-neutral-600">Services</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-lg font-bold text-neutral-900">{reviewCount}</p>
          <p className="text-xs text-neutral-600">Reviews</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3">
          <p className="text-lg font-bold text-neutral-900">{avgRating}</p>
          <p className="text-xs text-neutral-600">Avg rating</p>
        </div>
      </div>
    </section>
  );
}

export default function ProviderPublicProfile() {
  const { providerId } = useParams();
  const normalizedProviderId = decodeURIComponent(providerId || "").trim();
  const hasInvalidProviderId =
    !normalizedProviderId || normalizedProviderId.startsWith(":");
  const [page, setPage] = useState(1);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reviewsRef = useRef(null);
  const servicesRef = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (hasInvalidProviderId) {
        setError({ status: 404 });
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getProviderPublicProfile(
          normalizedProviderId,
          page,
          DEFAULT_LIMIT,
        );
        if (!isMounted) return;
        setProfileData(data);
      } catch (err) {
        if (!isMounted || err?.name === "AbortError") return;
        setError(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [hasInvalidProviderId, normalizedProviderId, page]);

  const onReviewPageChange = (nextPage) => {
    if (nextPage === page || nextPage < 1) return;
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      reviewsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const onViewServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stats = useMemo(() => profileData?.stats || {}, [profileData]);
  const provider = useMemo(() => profileData?.provider || {}, [profileData]);
  const badges = useMemo(() => profileData?.badges || [], [profileData]);
  const offerings = useMemo(
    () => profileData?.service_offerings || [],
    [profileData],
  );
  const reviews = useMemo(
    () => profileData?.reviews || { items: [], page: 1, total_pages: 1 },
    [profileData],
  );

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorState status={error?.status} />;
  if (!profileData) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <ProviderHeader
        provider={provider}
        stats={stats}
        badges={badges}
        onViewServices={onViewServices}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-neutral-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-700">
              {safeText(provider?.bio, "No bio provided.")}
            </p>
          </section>

          <div ref={servicesRef}>
            <ServiceOfferingGrid offerings={offerings} />
          </div>

          <div ref={reviewsRef}>
            <ReviewsList reviews={reviews} onPageChange={onReviewPageChange} />
          </div>
        </div>

        <aside className="space-y-6">
          <RatingDistribution
            distribution={stats?.rating_distribution || {}}
            reviewCount={stats?.review_count}
            avg={stats?.average_rating ?? stats?.avg_rating ?? 0}
          />

          <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Badges</h2>
            <div className="mt-4">
              <BadgeChips badges={badges} />
            </div>
          </section>

          <QuickStats
            servicesCount={offerings.length}
            reviewCount={Number(stats?.review_count || reviews?.total || 0)}
            avgRating={Number(
              stats?.average_rating ?? stats?.avg_rating ?? 0,
            ).toFixed(1)}
          />
        </aside>
      </div>
    </div>
  );
}
