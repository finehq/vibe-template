"use client";

import { Navigate, useNavigate } from "react-router-dom";
import { fine } from "@/lib/fine";
import { useEffect } from "react";

export const ProtectedRoute = ({ Component }: { Component: () => JSX.Element }) => {
  const { data: session, isPending } = fine.auth.useSession();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session?.user) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      navigate("/login");
    }
  }, [isPending, session]);

  if (isPending) return <div></div>;

  return session?.user ? <Component /> : null;
};
