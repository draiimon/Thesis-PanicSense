import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "wouter";

export default function AdminRedirect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If user is admin, redirect to manage users page
    if (user?.role === 'admin') {
      navigate("/admin/manage-users");
    } else {
      // Otherwise redirect to dashboard with error message
      toast({
        title: "Access Denied",
        description: "You don't have permission to access admin pages",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, navigate, toast]);

  return null; // This component just redirects, no need to render anything
}