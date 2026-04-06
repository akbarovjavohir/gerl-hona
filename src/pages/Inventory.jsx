import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Package, Plus, Trash2 } from 'lucide-react';
import { formatQuantity, roundTo } from '../utils/number';

const Inventory = () => {
    const { addStock, inventory, deleteStock, clearAllData, getSupplyDebt } = useData();
    const [qty, setQty] = useState('');
    const [totalCost, setTotalCost] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const quantity = roundTo(qty);
        const total = roundTo(totalCost);

        // Calculate cost per unit automatically
        const costPerUnit = quantity > 0 ? roundTo(total / quantity) : 0;

        addStock({
            quantity: quantity,
            costPerUnit: costPerUnit, // Derived value
            type: 'grel' // Default type
        });

        // REMOVED: addSupplyPayment. Debt is now tracked automatically.
        // Payment must be done manually in Expenses.

        setQty('');
        setTotalCost('');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Ombor boshqaruvi</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => {
                            if (window.confirm("Barcha ma'lumotlar o'chiriladi (Kirim, Savdo, Harajat). Tasdiqlaysizmi?")) {
                                clearAllData();
                            }
                        }}
                        style={{
                            background: 'var(--color-danger)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={18} /> Tozalash
                    </button>
                    <div style={{ background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Jami kirim: <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{formatQuantity(inventory.reduce((acc, i) => roundTo(acc + Number(i.quantity)), 0))} ta</span>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        Qarzdorlik: <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{getSupplyDebt().toLocaleString()} so'm</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card">
                    <h3>Kirim qilish</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>

                        <div>
                            <label>Soni (ta)</label>
                            <input type="number" value={qty} onChange={e => setQty(e.target.value)} required min="0.05" step="0.05" placeholder="Masalan: 50" />
                        </div>
                        <div>
                            <label>Jami Summa (so'm)</label>
                            <input type="number" value={totalCost} onChange={e => setTotalCost(e.target.value)} required min="0" placeholder="Masalan: 1000000" />
                            {qty > 0 && totalCost > 0 && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    1 donasi: {roundTo(totalCost / qty).toLocaleString()} so'm
                                </div>
                            )}
                        </div>
                        <button type="submit">
                            <Plus size={18} /> Qo'shish
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3>So'nggi kirimlar</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '400px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Sana</th>
                                    <th style={{ padding: '0.75rem' }}>Soni</th>
                                    <th style={{ padding: '0.75rem' }}>Narx</th>
                                    <th style={{ padding: '0.75rem' }}>Jami</th>
                                    <th style={{ padding: '0.75rem' }}>Amal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.slice().reverse().map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(item.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{formatQuantity(item.quantity)}</td>
                                        <td style={{ padding: '0.75rem' }}>{Number(item.costPerUnit).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>{roundTo(item.quantity * item.costPerUnit).toLocaleString()}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Rostdan ham o\'chirmoqchimisiz?')) deleteStock(item.id);
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
                    {inventory.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Kirimlar mavjud emas</p>}
                </div>
            </div>
        </div >
    );
};

export default Inventory;
