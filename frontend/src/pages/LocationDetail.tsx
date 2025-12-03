import { PageHeader } from "@/components/PageHeader";

const LocationDetail = () => {
  return (
    <div className="h-screen bg-gray-100 overflow-hidden flex flex-col relative" style={{ height: '100vh', overflow: 'hidden' }}>
      <PageHeader title="Location Detail" />
      
      <div className="flex-1 overflow-hidden flex flex-col pt-20 pb-6 px-6" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        {/* Page content goes here */}
      </div>
    </div>
  );
};

export default LocationDetail;
