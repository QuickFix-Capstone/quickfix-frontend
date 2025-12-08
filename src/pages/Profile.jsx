export default function Profile({ user }) {
  if (!user) return <p className="p-6">Login required</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold">My Profile</h1>

      <div className="mt-4 p-4 border rounded-lg">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>
    </div>
  );
}
