import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import ProctoringDashboard from "@/components/proctoring/proctoring-dashboard";

export default function ProctoringPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'candidate';

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <ProctoringDashboard userRole={userRole as 'super_admin' | 'sme' | 'manager_hr'} />
      </div>
    </MainLayout>
  );
}