
  import { createRoot } from "react-dom/client";
  import { GoogleOAuthProvider } from '@react-oauth/google';
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/toast.css";

  const GOOGLE_CLIENT_ID = "279478636705-ri3d1atla8mgjfakgjbs96kp9817junj.apps.googleusercontent.com";

  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
  