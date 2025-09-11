import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    sme: "SME",
    manager_hr: "Manager",
    candidate: "Candidate",
  };

  const getDashboardTitle = () => {
    const roleLabel = roleLabels[user?.role || ""];
    return roleLabel ? `${roleLabel} Dashboard` : title;
  };

  const getDashboardSubtitle = () => {
    switch (user?.role) {
      case "super_admin":
        return "Platform overview and system management";
      case "sme":
        return "Question creation and content management";
      case "manager_hr":
        return "Assessment creation and candidate management";
      case "candidate":
        return "Your assessments and progress";
      default:
        return subtitle || "Platform overview";
    }
  };

  return (
    <header className="bg-card border-b border-border p-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground" data-testid="header-title">
            {title === "Dashboard" ? getDashboardTitle() : title}
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="header-subtitle">
            {title === "Dashboard" ? getDashboardSubtitle() : subtitle}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button 
              size="icon" 
              variant="ghost"
              className="text-muted-foreground hover:text-card-foreground"
              data-testid="button-notifications"
            >
              <i className="fas fa-bell"></i>
            </Button>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </div>
          
          {/* Action button */}
          {action}
        </div>
      </div>
    </header>
  );
}
