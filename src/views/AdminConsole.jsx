import Card from "../components/UI/Card";
import GhostButton from "../components/UI/GhostButton";

export default function AdminConsole() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Admin Console</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {["Gigs Pending Review", "Jobs Flagged", "Open Disputes"].map((title, i) => (
          <Card key={title} className="p-4">
            <div className="text-neutral-500 text-sm">{title}</div>
            <div className="text-2xl font-bold mt-1">{[3, 1, 2][i]}</div>
          </Card>
        ))}
      </div>

      {/* LIST */}
      <Card className="mt-6 overflow-hidden">
        <div className="grid grid-cols-5 bg-neutral-50 p-3 font-semibold text-sm">
          <div>ID</div>
          <div>Type</div>
          <div>User</div>
          <div>Reason</div>
          <div>Actions</div>
        </div>

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="grid grid-cols-5 p-3 border-t text-sm items-center"
          >
            <div>#{1000 + i}</div>
            <div>{i === 1 ? "Gig" : "Job"}</div>
            <div>{i === 1 ? "Alex P." : "Jamie L."}</div>
            <div>{i === 1 ? "Photo requires review" : "Possible duplicate"}</div>

            <div className="flex gap-2">
              <GhostButton>Approve</GhostButton>
              <GhostButton className="border-red-300 text-red-600">
                Reject
              </GhostButton>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
