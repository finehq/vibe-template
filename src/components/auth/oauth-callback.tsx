import { useEffect } from "react";

/**
 * Non navigating requests are not forwarded to the backend.
 * This component forwards the request to the backend and then redirects to the resulting redirectUrl.
 */
export function OAuthCallback() {
  useEffect(() => {
    fetch(window.location.href)
      .then((res) => res.json())
      .then((data: { redirectUrl: string }) => (window.location.href = data.redirectUrl));
  }, []);
  return <div></div>;
}
