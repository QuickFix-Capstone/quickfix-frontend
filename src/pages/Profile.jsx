import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import { logoutUser } from "../auth/localAuth";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("quickfix_currentUser");
    if (!stored) return navigate("/login");
    setUser(JSON.parse(stored));
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xl">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{user.name}</h2>
            <p className="text-sm text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="space-y-2 text-slate-700 text-sm">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          {user.role === "provider" && (
            <>
              <p><strong>Service Type:</strong> {user.service_type}</p>
              <p><strong>License:</strong> {user.license_info}</p>
              <p><strong>Area:</strong> {user.service_area}</p>
            </>
          )}
        </div>

        <Button
          onClick={() => {
            logoutUser();
            navigate("/login");
          }}
          className="w-full bg-slate-900 hover:bg-slate-950"
        >
          Logout
        </Button>
      </Card>
    </div>
  );
}
