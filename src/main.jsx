import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "react-oidc-context"
import { WebStorageStateStore } from 'oidc-client-ts';
import { BrowserRouter } from "react-router-dom"
import './index.css'
import App from './App.jsx'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_45z5OMePi",
  client_id: "p2u5qdegml3hp60n6ohu52n2b",
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "phone openid email",
  userStore: new WebStorageStateStore({ store: window.localStorage }),

  onSigninCallback: (user) => {
    console.log("🎉 onSigninCallback triggered!");
    console.log("User from callback:", user);
    console.log("Redirecting to /customer/entry");
    window.location.href = "/customer/entry";
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
