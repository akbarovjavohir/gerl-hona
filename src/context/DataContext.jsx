import { createContext, useState, useEffect, useContext } from 'react';
import { roundTo } from '../utils/number';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const DataProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [supplyPayments, setSupplyPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();

    const events = new EventSource(`${API_URL}/events`);
    const handleChange = () => {
      fetchData();
    };

    events.addEventListener('data-changed', handleChange);
    events.addEventListener('connected', handleChange);
    events.onerror = (error) => {
      console.error('Realtime sync error:', error);
    };

    return () => {
      events.removeEventListener('data-changed', handleChange);
      events.removeEventListener('connected', handleChange);
      events.close();
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/data`);
      const result = await response.json();
      if (result.data) {
        setInventory(result.data.inventory || []);
        setSales(result.data.sales || []);
        setExpenses(result.data.expenses || []);
        setSupplyPayments(result.data.supplyPayments || []);
        setDebts(result.data.debts || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    try {
      await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      setInventory(prev => [newItem, ...prev]);
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const addSale = async (sale) => {
    const newSale = {
      ...sale,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    try {
      await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSale),
      });
      setSales(prev => [newSale, ...prev]);
    } catch (error) {
      console.error("Error adding sale:", error);
    }
  };

  const addExpense = async (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: expense.type || 'operating'
    };
    try {
      await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      setExpenses(prev => [newExpense, ...prev]);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Xatolik yuz berdi!");
    }
  };

  const deleteStock = async (id) => {
    try {
      await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  const deleteSale = async (id) => {
    try {
      await fetch(`${API_URL}/sales/${id}`, { method: 'DELETE' });
      setSales(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const addSupplyPayment = async (payment) => {
    const newPayment = {
      ...payment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    try {
      await fetch(`${API_URL}/supply-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment),
      });
      setSupplyPayments(prev => [newPayment, ...prev]);
    } catch (error) {
      console.error("Error adding supply payment:", error);
      alert("Xatolik yuz berdi! Serverni qayta ishga tushirib ko'ring.");
    }
  };

  const deleteSupplyPayment = async (id) => {
    try {
      await fetch(`${API_URL}/supply-payments/${id}`, { method: 'DELETE' });
      setSupplyPayments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting supply payment:", error);
    }
  };

  const addDebt = async (debt) => {
    try {
      const newDebt = { ...debt, id: Date.now().toString() };
      await fetch(`${API_URL}/debts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDebt)
      });
      setDebts(prev => [newDebt, ...prev]);
    } catch (error) {
      console.error("Error adding debt", error)
      alert("Nasiya qo'shishda xatolik!")
    }
  }

  const deleteDebt = async (id) => {
    try {
      await fetch(`${API_URL}/debts/${id}`, { method: 'DELETE' });
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting debt", error);
      alert("Xatolik!");
    }
  }

  const settleDebt = async (id) => {
    try {
      await fetch(`${API_URL}/debts/${id}/settle`, { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error("Error settling debt", error);
      alert("Nasiyani yopishda xatolik!");
    }
  }

  const clearAllData = async () => {
    try {
      await fetch(`${API_URL}/reset`, { method: 'POST' });
      setInventory([]);
      setSales([]);
      setExpenses([]);
      setSupplyPayments([]);
      setDebts([]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  };

  // Calculate current stock level
  const getStockSummary = () => {
    const totalIn = inventory.reduce((acc, curr) => roundTo(acc + Number(curr.quantity)), 0);
    const totalSold = sales.reduce((acc, curr) => {
      const saleQuantity = curr.items.reduce((s, i) => roundTo(s + Number(i.quantity)), 0);
      return roundTo(acc + saleQuantity);
    }, 0);
    const totalDebtSold = debts.reduce((acc, curr) => roundTo(acc + Number(curr.quantity || 0)), 0);
    return roundTo(Math.max(0, totalIn - totalSold - totalDebtSold));
  };

  // Calculate debt
  const getSupplyDebt = () => {
    const totalStockCost = inventory.reduce(
      (acc, curr) => roundTo(acc + (Number(curr.quantity) * Number(curr.costPerUnit))),
      0
    );
    const totalPayments = supplyPayments.reduce((acc, curr) => roundTo(acc + Number(curr.amount)), 0);
    return roundTo(totalStockCost - totalPayments);
  };

  return (
    <DataContext.Provider value={{
      inventory, sales, expenses, supplyPayments, debts,
      addStock, addSale, addExpense, addSupplyPayment, addDebt,
      deleteStock, deleteSale, deleteExpense, deleteSupplyPayment, deleteDebt, settleDebt,
      getStockSummary, getSupplyDebt,
      clearAllData,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};
