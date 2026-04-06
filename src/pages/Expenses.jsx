import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Wallet, Plus, Trash2 } from 'lucide-react';

const Expenses = () => {
    const { addExpense, expenses, deleteExpense, sales } = useData();
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        addExpense({
            amount: Number(amount),
            description: desc,
            type: 'operating'
        });
        setAmount('');
        setDesc('');
    };

    // Calculate daily stats
    const dailyStats = {};

    // 1. Process Sales
    sales.forEach(sale => {
        const date = new Date(sale.timestamp).toLocaleDateString();
        if (!dailyStats[date]) dailyStats[date] = { revenue: 0, operatingExpenses: 0, expensesList: [] };
        dailyStats[date].revenue += sale.total;
    });

    // 2. Process Expenses
    expenses.forEach(exp => {
        const date = new Date(exp.date).toLocaleDateString();
        // If dailyStats[date] doesn't exist yet (no sales that day), create it
        if (!dailyStats[date]) dailyStats[date] = { revenue: 0, operatingExpenses: 0, expensesList: [] };

        // We only show operating expenses here. 
        // Any legacy 'supply' type expenses are filtered out to keep this view clean.
        if (exp.type === 'supply') return;

        dailyStats[date].operatingExpenses += Number(exp.amount);
        dailyStats[date].expensesList.push(exp);
    });

    const sortedDates = Object.keys(dailyStats).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Moliya va Harajatlar</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Form Section */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3>Chiqim qo'shish</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label>Izoh</label>
                            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Masalan: Svet, Paket..." />
                        </div>
                        <div>
                            <label>Summa (so'm)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" placeholder="Masalan: 50000" />
                        </div>
                        <button type="submit">
                            <Plus size={18} /> Qo'shish
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="card">
                    <h3>Kunlik Hisob-kitob</h3>
                    {sortedDates.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Ma'lumot yo'q</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {sortedDates.map(date => {
                            const stats = dailyStats[date];
                            const profit = stats.revenue - stats.operatingExpenses;

                            return (
                                <div key={date} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{date}</h4>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span style={{ color: 'var(--color-success)' }}>Savdo: {stats.revenue.toLocaleString()}</span>
                                            <span style={{ color: 'var(--color-danger)' }}>Chiqim: {stats.operatingExpenses.toLocaleString()}</span>
                                            <span style={{ fontWeight: 'bold', color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                Foyda: {profit.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Operating Expenses List */}
                                    {stats.expensesList.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                                <tbody>
                                                    {stats.expensesList.map(item => (
                                                        <tr key={item.id}>
                                                            <td style={{ padding: '0.25rem' }}>{item.description}</td>
                                                            <td style={{ padding: '0.25rem', textAlign: 'right', color: 'var(--color-danger)' }}>-{Number(item.amount).toLocaleString()}</td>
                                                            <td style={{ padding: '0.25rem', width: '30px', textAlign: 'right' }}>
                                                                <button onClick={() => { if (window.confirm('O\'chiraymi?')) deleteExpense(item.id) }} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
