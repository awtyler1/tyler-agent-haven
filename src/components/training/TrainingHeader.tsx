import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import tylerLogo from "@/assets/tyler-logo.png";

export function TrainingHeader() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-white/80 backdrop-blur-sm border-b border-slate-100">
      <div className="h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={tylerLogo}
            alt="Tyler Insurance Group"
            className="h-8 w-auto"
          />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-slate-500 hover:text-[#1a1a1a] hover:bg-slate-100 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      </div>
    </header>
  );
}
