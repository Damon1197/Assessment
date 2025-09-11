import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: "",
    role: "",
  });

  // Note: This would be a real endpoint in production
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users", filters],
    retry: false,
    queryFn: async () => {
      // For now, return empty array as this endpoint doesn't exist yet
      return [];
    },
  });

  const roleColors = {
    super_admin: "destructive",
    sme: "default",
    manager_hr: "secondary",
    candidate: "outline",
  };

  const roleLabels = {
    super_admin: "Super Admin",
    sme: "Subject Matter Expert",
    manager_hr: "Manager/HR",
    candidate: "Candidate",
  };

  const canManageUsers = user?.role === 'super_admin';

  if (!canManageUsers) {
    return (
      <MainLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <i className="fas fa-lock text-4xl text-muted-foreground mb-4"></i>
              <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                You don't have permission to access user management.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage platform users and their roles</p>
          </div>
          <Button data-testid="button-invite-user">
            <i className="fas fa-user-plus mr-2"></i>Invite User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-stats-total-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-chart-1 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-1 mt-2">Across all roles</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-candidates">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Candidates</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-chart-2 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-2 mt-2">Assessment takers</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-smes">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SMEs</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-tie text-chart-3 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-3 mt-2">Content creators</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stats-managers">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Managers</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user-cog text-chart-4 text-lg"></i>
                </div>
              </div>
              <p className="text-xs text-chart-4 mt-2">Assessment managers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-testid="card-filters">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                data-testid="input-search-users"
              />
              
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="sme">Subject Matter Expert</SelectItem>
                  <SelectItem value="manager_hr">Manager/HR</SelectItem>
                  <SelectItem value="candidate">Candidate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card data-testid="card-users-list">
          <CardHeader>
            <CardTitle>Platform Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user: any, index: number) => (
                  <div key={user.id} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg" data-testid={`user-${index}`}>
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={roleColors[user.role as keyof typeof roleColors] as any}>
                            {roleLabels[user.role as keyof typeof roleLabels]}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button size="sm" variant="ghost" data-testid={`button-edit-user-${index}`}>
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-view-user-${index}`}>
                              <i className="fas fa-eye"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-users text-6xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground mb-2">No users found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Users will appear here as they join the platform
                </p>
                <Button data-testid="button-invite-first-user">
                  <i className="fas fa-user-plus mr-2"></i>Invite Your First User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card data-testid="card-role-distribution">
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(roleLabels).map(([role, label]) => (
                <div key={role} className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
