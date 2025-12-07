// src/pages/Login.jsx
import React from "react";
import { useAuth } from "react-oidc-context";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import { User, Briefcase } from "lucide-react";

export default function Login() {
  const auth = useAuth();

  const signInWith = (provider) => {
    auth.signinRedirect({
      extraQueryParams: {
        identity_provider: provider,
      },
    });
  };

  const SocialButton = ({ icon: Icon, label, onClick, className = "" }) => (
    <Button
      type="button"
      className={`group relative w-full justify-center gap-3 border-neutral-200 bg-white font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 ${className}`}
      variant="outline"
      onClick={onClick}
    >
      {Icon}
      <span className="flex-1 text-center">{label}</span>
    </Button>
  );

  const GoogleIcon = (
    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  const AppleIcon = (
    <svg className="h-5 w-5 text-neutral-900" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.07-.52-2.05-.51-3.21 0-1.4.6-2.54.13-3.4-.9C4.8 15.65 5.28 10.3 8.98 10c1.3-.1 2.27.7 2.97.7.75 0 1.94-.74 3.25-.6 2.3.13 3.3 1.23 3.8 1.98-3.3 1.7-2.73 5.4 1 6.8-.75 2.15-2.05 4.3-3.95 4.3zm-1.87-13.6c.9-1.2 1.55-2.7 1.34-4.2C15.14 2 13.56 2.9 12.65 4.14c-.9 1.15-1.57 2.8-1.34 4.3 1.5.16 3 .3 3.87-1.74z" />
    </svg>
  );

  const MicrosoftIcon = (
    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 23 23">
      <path fill="#f3f3f3" d="M0 0h23v23H0z" />
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white" />

      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-2">
        {/* CUSTOMER CARD */}
        <Card className="flex flex-col space-y-6 border-neutral-200/60 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 ring-4 ring-white">
              <User className="h-6 w-6 text-neutral-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">Customer</h2>
              <p className="text-sm text-neutral-500">
                Book trusted service providers
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-500">
            Sign in with your Google, Apple, or Microsoft account. New profiles are created automatically.
          </p>

          <div className="space-y-3">
            <SocialButton icon={GoogleIcon} label="Continue with Google" onClick={() => signInWith("Google")} />
            <SocialButton icon={AppleIcon} label="Continue with Apple" onClick={() => signInWith("SignInWithApple")} />
            <SocialButton icon={MicrosoftIcon} label="Continue with Microsoft" onClick={() => signInWith("Microsoft")} />
          </div>
        </Card>

        {/* PROVIDER CARD */}
        <Card className="flex flex-col space-y-6 border-neutral-200/60 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black ring-4 ring-neutral-100">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">Service Provider</h2>
              <p className="text-sm text-neutral-500">
                Manage jobs, quotes, and messages
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-500">
            Providers also sign in with social accounts. We'll guide you through onboarding next.
          </p>

          <div className="space-y-3">
            <SocialButton icon={GoogleIcon} label="Provider login with Google" onClick={() => signInWith("Google")} />
            <SocialButton icon={AppleIcon} label="Provider login with Apple" onClick={() => signInWith("SignInWithApple")} />
            <SocialButton icon={MicrosoftIcon} label="Provider login with Microsoft" onClick={() => signInWith("Microsoft")} />
          </div>
        </Card>
      </div>

      <div className="absolute bottom-6 text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} QuickFix. All rights reserved.
      </div>
    </div>
  );
}