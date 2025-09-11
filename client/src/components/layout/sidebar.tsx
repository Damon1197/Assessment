import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavigationItem {
  href: string;
  icon: string;
  label: string;
  roles?: string[];
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const navigationItems: NavigationItem[] = [
    { href: "/", icon: "fas fa-tachometer-alt", label: "Dashboard" },
    { href: "/question-bank", icon: "fas fa-database", label: "Question Bank", roles: ["super_admin", "sme"] },
    { href: "/assessments", icon: "fas fa-clipboard-list", label: "Assessments" },
    { href: "/users", icon: "fas fa-users", label: "User Management", roles: ["super_admin"] },
    { href: "/analytics", icon: "fas fa-chart-line", label: "Analytics", roles: ["super_admin"] },
  ];

  const toolItems: NavigationItem[] = [
    { href: "/ai-generator", icon: "fas fa-robot", label: "AI Question Gen", roles: ["super_admin", "sme"] },
    { href: "/code-editor", icon: "fas fa-code", label: "Code Sandbox" },
    { href: "/proctoring", icon: "fas fa-eye", label: "Live Proctoring", roles: ["super_admin", "manager_hr"] },
  ];

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    sme: "SME",
    manager_hr: "Manager",
    candidate: "Candidate",
  };

  const canAccessItem = (item: NavigationItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-clipboard-check text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-card-foreground">AssessmentPro</h1>
            <p className="text-xs text-muted-foreground">Enterprise Platform</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-semibold">
              {getInitials(user?.firstName || undefined, user?.lastName || undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground truncate" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-primary" data-testid="user-role">
              {roleLabels[user?.role || ""] || "User"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems
            .filter(canAccessItem)
            .map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => setLocation(item.href)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-card-foreground hover:bg-muted"
                  }`}
                  data-testid={`nav-${item.href.replace("/", "")}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
        </ul>

        <div className="mt-8">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tools
          </h4>
          <ul className="space-y-2">
            {toolItems
              .filter(canAccessItem)
              .map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => setLocation(item.href)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm rounded-lg text-left transition-colors ${
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-card-foreground hover:bg-muted"
                    }`}
                    data-testid={`tool-${item.href.replace("/", "")}`}
                  >
                    <i className={`${item.icon} w-5`}></i>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => window.location.href = "/api/logout"}
          data-testid="button-sign-out"
        >
          <i className="fas fa-sign-out-alt w-5 mr-3"></i>
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
