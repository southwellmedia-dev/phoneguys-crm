"use client";

import { useEffect, ReactNode } from "react";
import { useHeader } from "@/lib/contexts/header-context";
import { HeaderAction } from "./page-header";

interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: HeaderAction[];
  children: ReactNode;
}

export function PageContainer({
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader({ title, description, actions });
    
    // Reset on unmount
    return () => {
      setHeader({ title: "The Phone Guys CRM" });
    };
  }, [title, description, actions, setHeader]);

  return <div className="container mx-auto p-6">{children}</div>;
}