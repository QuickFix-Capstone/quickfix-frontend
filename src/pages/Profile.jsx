import Card from "../components/UI/Card";
import Button from "../components/UI/Button";

export default function Profile({ setView }) {
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <Card className="p-6 space-y-4">
        {loggedIn ? (
          <>
            <p className="text-neutral-700">You are logged in.</p>

            <Button className="w-full" onClick={() => setView("logout")}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <p className="text-neutral-700">You are not logged in.</p>

            <Button className="w-full" onClick={() => setView("login")}>
              Login
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
