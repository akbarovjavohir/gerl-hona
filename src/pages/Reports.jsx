import { useData } from '../context/DataContext';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

const Reports = () => {
    const { sales, inventory, expenses, debts } = useData();

    const totalCashSalesRevenue = sales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const totalDebtRevenue = debts.reduce((acc, debt) => acc + Number(debt.amount), 0);
    const totalSalesRevenue = totalCashSalesRevenue + totalDebtRevenue;

    // Total Inventory Cost = All Stock Inputs (Qty * Cost)
    const totalInventoryCost = inventory.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.costPerUnit)), 0);

    // Total Expenses = All Expenses
    // Total Expenses = Operating Expenses Only
    const totalExpenses = expenses.filter(e => e.type !== 'supply').reduce((acc, expense) => acc + Number(expense.amount), 0);

    // Net Profit
    const netProfit = totalSalesRevenue - (totalInventoryCost + totalExpenses);

    // Calculate Average Cost per Unit (Weighted Average)
    // Total Money Spent on Inventory / Total Units Purchased
    const totalInventoryQty = inventory.reduce((acc, i) => acc + Number(i.quantity), 0);
    const avgCost = totalInventoryQty > 0 ? totalInventoryCost / totalInventoryQty : 0;
    const totalCashQty = sales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + Number(item.quantity), 0), 0);
    const totalCashProfit = totalCashSalesRevenue - (totalCashQty * avgCost) - totalExpenses;

    // Group Sales by Day
    const dailyData = {};

    // 1. Process Sales
    sales.forEach(sale => {
        const date = new Date(sale.timestamp).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = { revenue: 0, cashRevenue: 0, debtRevenue: 0, cashQty: 0, debtQty: 0, count: 0, expenses: 0, dateObj: new Date(sale.timestamp) };
        }
        dailyData[date].revenue += Number(sale.total);
        dailyData[date].cashRevenue += Number(sale.total);
        const saleQty = sale.items.reduce((a, i) => a + Number(i.quantity), 0);
        dailyData[date].cashQty += saleQty;
        dailyData[date].count += saleQty;
    });

    debts.forEach(debt => {
        const date = new Date(debt.date).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = { revenue: 0, cashRevenue: 0, debtRevenue: 0, cashQty: 0, debtQty: 0, count: 0, expenses: 0, dateObj: new Date(debt.date) };
        }
        dailyData[date].revenue += Number(debt.amount);
        dailyData[date].debtRevenue += Number(debt.amount);
        dailyData[date].debtQty += Number(debt.quantity || 0);
        dailyData[date].count += Number(debt.quantity || 0);
    });

    // 2. Process Expenses
    expenses.forEach(exp => {
        if (exp.type === 'supply') return; // Skip supply costs as they are part of inventory/COGS logic roughly speaking (though here we use avgCost for COGS)

        const date = new Date(exp.date).toLocaleDateString();
        if (!dailyData[date]) {
            // If no sales on this day, we create an entry with 0 revenue
            dailyData[date] = { revenue: 0, cashRevenue: 0, debtRevenue: 0, cashQty: 0, debtQty: 0, count: 0, expenses: 0, dateObj: new Date(exp.date) };
        }
        dailyData[date].expenses += Number(exp.amount);
    });

    // Convert to Array and Sort
    const reportData = Object.values(dailyData).sort((a, b) => b.dateObj - a.dateObj).map(day => {
        const estimatedCost = day.count * avgCost;
        const cashEstimatedCost = day.cashQty * avgCost;
        const cashProfit = day.cashRevenue - cashEstimatedCost - day.expenses;
        const profit = day.revenue - estimatedCost - day.expenses;
        return {
            ...day,
            estimatedCost,
            cashEstimatedCost,
            cashProfit,
            profit
        };
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Moliya Hisoboti</h2>
                <div style={{ color: 'var(--color-text-muted)' }}>
                    Kirik - Chiqim usuli
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Naqd Savdo</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{totalCashSalesRevenue.toLocaleString()}</div>
                </div>

                <div className="card" style={{ border: totalCashProfit >= 0 ? '1px solid var(--color-success)' : '1px solid var(--color-danger)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Naqd Foyda</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: totalCashProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {totalCashProfit > 0 ? '+' : ''}{totalCashProfit.toLocaleString()}
                    </div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Nasiya Savdo</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalDebtRevenue.toLocaleString()}</div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Jami Tovuq Kirimi</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{totalInventoryCost.toLocaleString()}</div>
                </div>

                <div className="card">
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Qo'shimcha Harajat</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{totalExpenses.toLocaleString()}</div>
                </div>

                <div className="card" style={{ border: netProfit >= 0 ? '1px solid var(--color-success)' : '1px solid var(--color-danger)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Sof Foyda</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {netProfit > 0 ? '+' : ''}{netProfit.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Kunlik Hisobot</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '0.75rem' }}>Sana</th>
                                <th style={{ padding: '0.75rem' }}>Sotildi (ta)</th>
                                <th style={{ padding: '0.75rem' }}>Naqd</th>
                                <th style={{ padding: '0.75rem' }}>Nasiya</th>
                                <th style={{ padding: '0.75rem' }}>Jami Savdo</th>
                                <th style={{ padding: '0.75rem' }}>Tannarx (taxminiy)</th>
                                <th style={{ padding: '0.75rem' }}>Chiqim</th>
                                <th style={{ padding: '0.75rem' }}>Naqd Foyda</th>
                                <th style={{ padding: '0.75rem' }}>Foyda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((day, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{day.dateObj.toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem' }}>{day.count}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-success)' }}>{day.cashRevenue.toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-primary)' }}>{day.debtRevenue.toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{day.revenue.toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>{day.estimatedCost.toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-danger)' }}>{day.expenses > 0 ? '-' + day.expenses.toLocaleString() : '0'}</td>
                                    <td style={{ padding: '0.75rem', color: day.cashProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                                        {day.cashProfit > 0 ? '+' : ''}{day.cashProfit.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem', color: day.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                                        {day.profit > 0 ? '+' : ''}{day.profit.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {reportData.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Ma'lumot mavjud emas</p>}
            </div>
        </div>
    );
};

export default Reports;
