import { PageHeader } from "@/components/PageHeader";

const LocationDetail = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <PageHeader title="Location Detail" />
      
      <div className="flex-1 overflow-auto flex flex-col pt-20 pb-6 px-6">
        {/* Page content goes here */}
      </div>
    </div>
  );
};

export default LocationDetail;
