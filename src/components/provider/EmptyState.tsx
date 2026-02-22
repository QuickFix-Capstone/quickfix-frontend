export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
