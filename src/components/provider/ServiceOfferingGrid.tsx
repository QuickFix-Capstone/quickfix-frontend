import EmptyState from "./EmptyState";
import ServiceOfferingCard from "./ServiceOfferingCard";

export default function ServiceOfferingGrid({ offerings = [] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Services</h2>

      {offerings.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {offerings.map((offering) => (
            <ServiceOfferingCard
              key={offering.service_offering_id || offering.offering_id}
              offering={offering}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title="No active services available." />
        </div>
      )}
    </section>
  );
}
