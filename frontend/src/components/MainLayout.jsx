import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import { Outlet } from 'react-router-dom'; // 1. Import Outlet

function MainLayout() {
  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar (persistent) */}
      <div className="w-1/5 border-r">
        <Sidebar />
      </div>

      {/* Main Content (this will change based on the route) */}
      <main className="w-3/5 overflow-y-auto">
        <Outlet /> {/* 2. Child routes will be rendered here */}
      </main>

      {/* Right Panel (persistent) */}
      <div className="w-1/5 border-l">
        <RightPanel />
      </div>
    </div>
  );
}

export default MainLayout;