import { useState } from 'react';
import { useData } from '../context/DataContext';
import { ShoppingCart, AlertCircle, Trash2 } from 'lucide-react';
import { formatQuantity, roundTo } from '../utils/number';

const Sales = () => {
    const { addSale, sales, getStockSummary, deleteSale } = useData();
    const [price, setPrice] = useState(50000);
    const [qty, setQty] = useState(1);

    const currentStock = getStockSummary();
    const DEFAULT_UNIT_PRICE = 50000;

    const handleQtyChange = (e) => {
        const newQty = Number(e.target.value);
        setQty(newQty);
        setPrice(roundTo(newQty * DEFAULT_UNIT_PRICE));
    };

    const handleSell = (e) => {
        e.preventDefault();

        if (qty > currentStock) {
            alert("Omborda mahsulot yetarli emas!");
            return;
        }

        // 'price' in state is now the TOTAL price displayed to the user
        const total = roundTo(price);
        const unitPrice = qty > 0 ? roundTo(total / qty) : 0;

        addSale({
            items: [{ name: 'Grill', quantity: roundTo(qty), price: unitPrice }],
            total: total
        });
        setQty(1);
        setPrice(DEFAULT_UNIT_PRICE);
    };

    const today = new Date().toLocaleDateString();
    const todaysSales = sales.filter(s => new Date(s.timestamp).toLocaleDateString() === today);
    const totalRevenue = todaysSales.reduce((acc, s) => roundTo(acc + Number(s.total)), 0);
    const totalSoldQty = todaysSales.reduce((acc, s) => roundTo(acc + Number(s.items[0].quantity)), 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Savdo oynasi</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Omborda: <span style={{ color: currentStock < 10 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatQuantity(currentStock)} ta</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Bugun: <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalRevenue.toLocaleString()} so'm</span> ({formatQuantity(totalSoldQty)} ta)
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Yangi savdo</h3>

                    {currentStock <= 0 && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <AlertCircle size={20} />
                            <span>Omborda mahsulot qolmadi!</span>
                        </div>
                    )}

                    <form onSubmit={handleSell} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label>Mahsulot</label>
                            <select disabled style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                                <option>Tovuq Grill (Butun)</option>
                            </select>
                        </div>
                        <div>
                            <label>Soni</label>
                            <input type="number" value={qty} onChange={handleQtyChange} required min="0.05" step="0.05" max={currentStock > 0 ? currentStock : 1} disabled={currentStock <= 0} />
                        </div>
                        <div>
                            <label>Jami Narxi (so'm)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                        </div>
                        <button type="submit" disabled={currentStock <= 0} style={{ opacity: currentStock <= 0 ? 0.5 : 1, cursor: currentStock <= 0 ? 'not-allowed' : 'pointer' }}>
                            <ShoppingCart size={18} /> Sotish
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3>Bugungi savdolar</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Vaqt</th>
                                    <th style={{ padding: '0.75rem' }}>Mahsulot</th>
                                    <th style={{ padding: '0.75rem' }}>Soni</th>
                                    <th style={{ padding: '0.75rem' }}>Narx</th>
                                    <th style={{ padding: '0.75rem' }}>Jami</th>
                                    <th style={{ padding: '0.75rem' }}>Amal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysSales.slice().reverse().map(sale => (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{sale.items[0].name}</td>
                                        <td style={{ padding: '0.75rem' }}>{formatQuantity(sale.items[0].quantity)}</td>
                                        <td style={{ padding: '0.75rem' }}>{Number(sale.items[0].price).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{Number(sale.total).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Rostdan ham o\'chirmoqchimisiz?')) deleteSale(sale.id);
                                                }}
                                                style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}
                                                title="O'chirish"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {todaysSales.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Bugun hali savdo bo'lmadi</p>}
                </div>
            </div>
        </div>
    );
};
export default Sales;
