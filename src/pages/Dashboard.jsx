import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Package, ShoppingCart, TrendingUp, ChefHat } from 'lucide-react';
import { formatQuantity, roundTo } from '../utils/number';

const Dashboard = () => {
    const { getStockSummary, sales } = useData();
    const currentStock = getStockSummary();

    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const totalRevenue = todaysSales.reduce((acc, s) => roundTo(acc + Number(s.total)), 0);

    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
                <div className="hero-badge" style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                    <ChefHat size={48} />
                </div>
                <h1>Grill House</h1>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Boshqaruv tizimi</p>
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <Link to="/inventory">
                    <div className="card spotlight-card" style={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius)' }}>
                                <Package size={24} color="var(--color-primary)" />
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatQuantity(currentStock)}</span>
                        </div>
                        <h3>Ombor</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Mavjud tovuqlar soni</p>
                    </div>
                </Link>

                <Link to="/sales">
                    <div className="card spotlight-card" style={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer', borderLeft: '4px solid var(--color-success)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius)' }}>
                                <ShoppingCart size={24} color="var(--color-success)" />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{todaysSales.length} ta</span>
                        </div>
                        <h3>Savdo</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Bugungi savdolar soni</p>
                    </div>
                </Link>

                <Link to="/reports">
                    <div className="card spotlight-card" style={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer', borderLeft: '4px solid #67e8f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius)' }}>
                                <TrendingUp size={24} color="#67e8f9" />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalRevenue.toLocaleString()}</span>
                        </div>
                        <h3>Hisobot</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Bugungi tushum (so'm)</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
