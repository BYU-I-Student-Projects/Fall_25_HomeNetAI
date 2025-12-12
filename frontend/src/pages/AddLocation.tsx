import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AddLocation = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      {/* Fixed Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-gray-100 z-50 flex items-center" style={{ position: 'fixed', zIndex: 50 }}>
        {/* HomeNetAI - Top left */}
        <div className="absolute left-6">
          <h1 className="text-xl font-bold text-[#f97316]">HomeNetAI</h1>
        </div>
        
        {/* Centered Page Title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h2 className="text-xl font-semibold text-[#f97316]">Add Location</h2>
        </div>
        
        {/* Search and Icons - Top right */}
        <div className="absolute right-6 flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#f97316]" />
            <Input
              id="addlocation-search"
              name="addlocation-search"
              type="text"
              placeholder="Search for any Weather info....."
              className="pl-11 pr-4 h-12 w-72 rounded-full bg-white shadow-sm border-0 focus-visible:ring-2 focus-visible:ring-[#f97316]/20"
            />
          </div>
          
          {/* Notification Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0"
          >
            <Bell className="h-6 w-6 text-[#f97316]" />
          </Button>
          
          {/* Menu Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0"
          >
            <Menu className="h-6 w-6 text-[#f97316]" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex flex-col pt-20 pb-6 px-6">
        {/* Page content goes here */}
      </div>
    </div>
  );
};

export default AddLocation;
