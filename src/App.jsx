import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, ChefHat, Wallet, Users } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Debts from './pages/Debts';

const NavLink = ({ to, icon: Icon, children, compactOnMobile = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? 'active' : ''}`}
      aria-label={typeof children === 'string' ? children : undefined}
      title={typeof children === 'string' ? children : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={18} />
        <span className={compactOnMobile ? 'nav-label compact-mobile' : 'nav-label'}>{children}</span>
      </div>
    </Link>
  );
};

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ChefHat size={32} />
          Grill House
        </div>
        <div className="nav-links">
          <NavLink to="/" icon={LayoutDashboard}>Bosh sahifa</NavLink>
          <NavLink to="/inventory" icon={Package} compactOnMobile>Ombor</NavLink>
          <NavLink to="/sales" icon={ShoppingCart} compactOnMobile>Savdo</NavLink>
          <NavLink to="/expenses" icon={Wallet}>Harajatlar</NavLink>
          <NavLink to="/debts" icon={Users}>Nasiyalar</NavLink>
          <NavLink to="/reports" icon={BarChart3}>Hisobot</NavLink>
        </div>
      </nav>
      <main key={location.pathname} className="route-stage">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <Router>
        <AppLayout />
      </Router>
    </DataProvider>
  );
}

export default App;
