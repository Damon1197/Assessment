import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function MainLayout({ 
  children, 
  title = "Dashboard", 
  subtitle,
  action 
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background" data-testid="main-layout">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} action={action} />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
