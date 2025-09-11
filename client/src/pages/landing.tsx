import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Logo Section */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-check text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AssessmentPro</h1>
                <p className="text-sm text-muted-foreground">Enterprise Platform</p>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Welcome</h2>
              <p className="text-muted-foreground text-sm">
                Access your assessment platform to evaluate skills, create questions, and track performance.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-brain text-chart-1 text-sm"></i>
                </div>
                <span className="text-sm text-foreground">AI-Powered Question Generation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-code text-chart-2 text-sm"></i>
                </div>
                <span className="text-sm text-foreground">Multi-Modal Assessment Types</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-chart-3 text-sm"></i>
                </div>
                <span className="text-sm text-foreground">Advanced Analytics & Reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-eye text-chart-4 text-sm"></i>
                </div>
                <span className="text-sm text-foreground">Live Proctoring Capabilities</span>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In to Continue
            </Button>

            <p className="text-xs text-muted-foreground">
              Secure authentication powered by enterprise-grade technology
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
