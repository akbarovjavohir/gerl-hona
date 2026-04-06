import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Users, Plus, Trash2, CheckCircle } from 'lucide-react';
import { formatQuantity, roundTo } from '../utils/number';

const Debts = () => {
    const { debts, addDebt, settleDebt, getStockSummary } = useData();
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const currentStock = getStockSummary();

    const handleSubmit = (e) => {
        e.preventDefault();

        const quantity = roundTo(qty);
        if (quantity > currentStock) {
            alert("Omborda mahsulot yetarli emas!");
            return;
        }

        addDebt({
            name,
            quantity,
            amount: roundTo(amount),
            description: desc,
            date: new Date().toISOString()
        });
        setName('');
        setQty('');
        setAmount('');
        setDesc('');
    };

    const totalDebt = debts.reduce((acc, curr) => roundTo(acc + Number(curr.amount)), 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Mijozlar Nasiyasi</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Omborda: <span style={{ color: currentStock < 10 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatQuantity(currentStock)} ta</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Jami Nasiya: <span style={{ color: 'var(--color-danger)', fontWeight: 'bold', fontSize: '1.2rem' }}>{totalDebt.toLocaleString()} so'm</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3>Nasiya qo'shish</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label>Mijoz Ismi</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Masalan: Azizbek" />
                        </div>
                        <div>
                            <label>Soni (ta)</label>
                            <input type="number" value={qty} onChange={e => setQty(e.target.value)} required min="0.05" step="0.05" max={currentStock > 0 ? currentStock : 1} placeholder="Masalan: 1" />
                        </div>
                        <div>
                            <label>Summa (so'm)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" placeholder="Masalan: 50000" />
                        </div>
                        <div>
                            <label>Izoh (Ixtiyoriy)</label>
                            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Masalan: 2 ta tovuq puli" />
                        </div>
                        <button type="submit">
                            <Plus size={18} /> Qo'shish
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3>Nasiyalar Ro'yxati</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Sana</th>
                                    <th style={{ padding: '0.75rem' }}>Mijoz</th>
                                    <th style={{ padding: '0.75rem' }}>Soni</th>
                                    <th style={{ padding: '0.75rem' }}>Izoh</th>
                                    <th style={{ padding: '0.75rem' }}>Summa</th>
                                    <th style={{ padding: '0.75rem' }}>Amal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debts.slice().reverse().map(debt => (
                                    <tr key={debt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(debt.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{debt.name}</td>
                                        <td style={{ padding: '0.75rem' }}>{formatQuantity(debt.quantity || 0)}</td>
                                        <td style={{ padding: '0.75rem' }}>{debt.description || '-'}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--color-danger)' }}>{Number(debt.amount).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Nasiya to\'liq to\'landimi? Unda u savdoga o\'tkaziladi.')) settleDebt(debt.id);
                                                }}
                                                style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-success)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                title="To'landi deb belgilash"
                                            >
                                                <CheckCircle size={18} /> To'landi
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {debts.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Nasiyalar mavjud emas</p>}
                </div>
            </div>
        </div>
    );
};

export default Debts;
