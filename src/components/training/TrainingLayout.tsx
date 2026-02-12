import { ReactNode } from "react";

interface TrainingLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function TrainingLayout({ sidebar, content }: TrainingLayoutProps) {
  return (
    <div className="px-4 sm:px-6 py-5">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-12 gap-3.5">
          <div className="col-span-12 lg:col-span-3">{sidebar}</div>
          <div className="col-span-12 lg:col-span-9">{content}</div>
        </div>
      </div>
    </div>
  );
}
