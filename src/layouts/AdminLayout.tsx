import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, BarChart, Users, LogOut, Settings, BookOpen, MessageSquare, FileText, Calendar, CheckSquare, CreditCard, Star, Info } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => {
  const location = useLocation();
  const active = location.pathname === to;
  
  return (
    <Link 
      to={to}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-red-600 text-white shadow-md' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-red-400'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const AdminLayout = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true' || !!localStorage.getItem('adminToken');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto pb-4">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Yash<span className="text-red-500">Edu</span>
              <span className="text-xs ml-1 text-gray-500 font-normal border border-gray-700 px-1.5 py-0.5 rounded">Admin</span>
            </span>
          </div>
          
          <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4 px-4">Dashboard</p>
              <SidebarItem icon={BarChart} label="Analytics Overview" to="/" />
              
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">User Management</p>
              <SidebarItem icon={Users} label="Students" to="/students" />
              <SidebarItem icon={Users} label="Parents" to="/parents" />
              
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">Academic Modules</p>
              <SidebarItem icon={Calendar} label="Attendance" to="/attendance" />
              <SidebarItem icon={FileText} label="Academics & Reports" to="/academics" />
              <SidebarItem icon={FileText} label="Assignments" to="/assignments" />
              <SidebarItem icon={CheckSquare} label="Practice Tests" to="/practice-tests" />
              <SidebarItem icon={CreditCard} label="Fee Payments" to="/fees" />
              <SidebarItem icon={MessageSquare} label="Message Parent" to="/messages" />

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">Content & CMS</p>
              <SidebarItem icon={BookOpen} label="Courses" to="/courses" />
              <SidebarItem icon={Star} label="Trending Courses" to="/trending-courses" />
              <SidebarItem icon={Star} label="Home Learning Story" to="/home-learning" />
              <SidebarItem icon={FileText} label="Blogs" to="/blogs" />
              <SidebarItem icon={Info} label="About Us Page" to="/about-us" />
              <SidebarItem icon={MessageSquare} label="Queries" to="/queries" />
              
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-4">System</p>

            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
