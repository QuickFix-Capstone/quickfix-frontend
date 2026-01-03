import { signInWithRedirect } from "aws-amplify/auth";

export default function SocialAuthButtons() {
  return (
    <div className="space-y-3">
      <button
        onClick={() => signInWithRedirect({ provider: "Google" })}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-100"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5" />
        Continue with Google
      </button>

      {/* Apple-ready */}
      <button
        onClick={() => signInWithRedirect({ provider: "Apple" })}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-100"
      >
        <img src="https://www.svgrepo.com/show/452210/apple.svg" className="h-5" />
        Continue with Apple
      </button>
    </div>
  );
}
