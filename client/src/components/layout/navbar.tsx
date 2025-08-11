import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const user = auth.getUser();

  const handleLogout = () => {
    auth.logout();
    queryClient.clear();
  };

  const handleUploadCSV = () => {
    setShowUploadModal(true);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/transactions", label: "Transactions" },
    { path: "/investments", label: "Investments" },
    { path: "/analytics", label: "Analytics" },
    { path: "/goals", label: "Goals" },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-900">FinSight</h1>
            </Link>
            <div className="hidden md:flex space-x-8 ml-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`font-medium transition-colors ${
                    location === item.path
                      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleUploadCSV} className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-upload mr-2"></i>
              Upload CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-slate-600 text-sm"></i>
                  </div>
                  <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
