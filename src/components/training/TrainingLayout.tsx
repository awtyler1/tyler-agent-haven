import { ReactNode } from "react";
import { TrainingHeader } from "./TrainingHeader";

interface TrainingLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function TrainingLayout({ sidebar, content }: TrainingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <TrainingHeader />
      <div className="flex h-[calc(100vh-56px)] pt-14">
        {sidebar}
        {content}
      </div>
    </div>
  );
}
