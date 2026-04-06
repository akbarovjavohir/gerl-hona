import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Bonjour } from 'bonjour-service';
import db from './database.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const eventClients = new Set();
let eventVersion = 0;
const bonjour = new Bonjour();
let httpServer;
let lanService;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Root
app.get('/', (req, res) => {
    res.json({ "message": "Grel App Backend Running" });
});

app.get('/api/health', (req, res) => {
    res.json({ message: 'ok', host: HOST, port: PORT });
});

const broadcastDataChange = (entity, action) => {
    eventVersion += 1;
    const payload = JSON.stringify({
        type: 'data-changed',
        entity,
        action,
        version: eventVersion,
        at: new Date().toISOString()
    });

    for (const client of eventClients) {
        client.write(`id: ${eventVersion}\n`);
        client.write('event: data-changed\n');
        client.write(`data: ${payload}\n\n`);
    }
};

app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('retry: 3000\n\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ version: eventVersion })}\n\n`);

    eventClients.add(res);

    const heartbeat = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        eventClients.delete(res);
        res.end();
    });
});

// --- DATA FETCH ---
app.get('/api/data', (req, res) => {
    const data = {};

    db.all("SELECT * FROM inventory", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        data.inventory = rows;

        db.all("SELECT * FROM sales", [], (err, rows) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            // Parse items JSON
            data.sales = rows.map(sale => ({
                ...sale,
                items: JSON.parse(sale.items)
            }));

            db.all("SELECT * FROM expenses", [], (err, rows) => {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                data.expenses = rows;

                db.all("SELECT * FROM supply_payments", [], (err, rows) => {
                    if (err) {
                        res.status(400).json({ "error": err.message });
                        return;
                    }
                    data.supplyPayments = rows;

                    db.all("SELECT * FROM debts", [], (err, rows) => {
                        if (err) {
                            res.status(400).json({ "error": err.message });
                            return;
                        }
                        data.debts = rows;

                        res.json({
                            "message": "success",
                            "data": data
                        });
                    });
                });
            });
        });
    });
});

// --- INVENTORY ---
app.post('/api/inventory', (req, res) => {
    const { id, date, quantity, costPerUnit, type } = req.body;
    const sql = 'INSERT INTO inventory (id, date, quantity, costPerUnit, type) VALUES (?,?,?,?,?)';
    const params = [id, date, quantity, costPerUnit, type];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        broadcastDataChange('inventory', 'created');
        res.json({ "message": "success", "data": req.body });
    });
});

app.delete('/api/inventory/:id', (req, res) => {
    db.run('DELETE FROM inventory WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        broadcastDataChange('inventory', 'deleted');
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- SALES ---
app.post('/api/sales', (req, res) => {
    const { id, timestamp, total, items } = req.body;
    const sql = 'INSERT INTO sales (id, timestamp, total, items) VALUES (?,?,?,?)';
    const params = [id, timestamp, total, JSON.stringify(items)];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        broadcastDataChange('sales', 'created');
        res.json({ "message": "success", "data": req.body });
    });
});

app.delete('/api/sales/:id', (req, res) => {
    db.run('DELETE FROM sales WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        broadcastDataChange('sales', 'deleted');
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- EXPENSES ---
app.get("/api/expenses", (req, res, next) => {
    var sql = "select * from expenses"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

app.post("/api/expenses", (req, res, next) => {
    var errors = []
    if (!req.body.description) {
        errors.push("No description specified");
    }
    if (!req.body.amount) {
        errors.push("No amount specified");
    }
    if (errors.length) {
        res.status(400).json({ "error": errors.join(",") });
        return;
    }
    var data = {
        description: req.body.description,
        amount: req.body.amount,
        type: req.body.type || 'operating',
        id: req.body.id,
        date: req.body.date
    }
    var sql = 'INSERT INTO expenses (id, date, description, amount, type) VALUES (?,?,?,?,?)'
    var params = [data.id, data.date, data.description, data.amount, data.type]
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        broadcastDataChange('expenses', 'created');
        res.json({
            "message": "success",
            "data": data,
            "id": this.lastID
        })
    });
});

app.delete('/api/expenses/:id', (req, res) => {
    db.run('DELETE FROM expenses WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        broadcastDataChange('expenses', 'deleted');
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- SUPPLY PAYMENTS ---
app.post('/api/supply-payments', (req, res) => {
    const { id, date, amount, description } = req.body;
    const sql = 'INSERT INTO supply_payments (id, date, amount, description) VALUES (?,?,?,?)';
    const params = [id, date, amount, description];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        broadcastDataChange('supply-payments', 'created');
        res.json({ "message": "success", "data": req.body });
    });
});

app.delete('/api/supply-payments/:id', (req, res) => {
    db.run('DELETE FROM supply_payments WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        broadcastDataChange('supply-payments', 'deleted');
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- DEBTS (NASIYALAR) ---
app.post('/api/debts', (req, res) => {
    const { id, name, amount, description, date, quantity } = req.body;
    const sql = 'INSERT INTO debts (id, name, amount, description, date, quantity) VALUES (?,?,?,?,?,?)';
    const params = [id, name, amount, description, date, quantity || 0];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        broadcastDataChange('debts', 'created');
        res.json({ "message": "success", "data": req.body });
    });
});

app.post('/api/debts/:id/settle', (req, res) => {
    const debtId = req.params.id;

    db.get('SELECT * FROM debts WHERE id = ?', [debtId], (selectErr, debt) => {
        if (selectErr) {
            res.status(400).json({ error: selectErr.message });
            return;
        }

        if (!debt) {
            res.status(404).json({ error: 'Debt not found' });
            return;
        }

        const quantity = Number(debt.quantity || 0);
        const total = Number(debt.amount || 0);
        const unitPrice = quantity > 0 ? total / quantity : total;
        const settledSale = {
            id: `${Date.now()}-settled`,
            timestamp: new Date().toISOString(),
            total,
            items: [
                {
                    name: 'Grill',
                    quantity,
                    price: unitPrice
                }
            ]
        };

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run(
                'INSERT INTO sales (id, timestamp, total, items) VALUES (?,?,?,?)',
                [settledSale.id, settledSale.timestamp, settledSale.total, JSON.stringify(settledSale.items)],
                function (insertErr) {
                    if (insertErr) {
                        db.run('ROLLBACK');
                        res.status(400).json({ error: insertErr.message });
                        return;
                    }

                    db.run('DELETE FROM debts WHERE id = ?', [debtId], function (deleteErr) {
                        if (deleteErr) {
                            db.run('ROLLBACK');
                            res.status(400).json({ error: deleteErr.message });
                            return;
                        }

                        db.run('COMMIT', (commitErr) => {
                            if (commitErr) {
                                db.run('ROLLBACK');
                                res.status(400).json({ error: commitErr.message });
                                return;
                            }

                            broadcastDataChange('debts', 'settled');
                            res.json({ message: 'settled', data: settledSale });
                        });
                    });
                }
            );
        });
    });
});

app.delete('/api/debts/:id', (req, res) => {
    db.run('DELETE FROM debts WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": res.message });
            return;
        }
        broadcastDataChange('debts', 'deleted');
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// --- RESET ---
app.post('/api/reset', (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM inventory');
        db.run('DELETE FROM sales');
        db.run('DELETE FROM expenses');
        db.run('DELETE FROM supply_payments');
        db.run('DELETE FROM debts');
    });
    broadcastDataChange('all', 'reset');
    res.json({ "message": "All data cleared" });
});

httpServer = app.listen(PORT, HOST, () => {
    lanService = bonjour.publish({
        name: 'grel-hona-server',
        type: 'grelhona',
        port: PORT,
        txt: { path: '/api' }
    });
    console.log(`Server running on http://${HOST}:${PORT}`);
});

const shutdown = () => {
    for (const client of eventClients) {
        client.end();
    }
    if (lanService) {
        lanService.stop(() => {
            bonjour.destroy();
        });
    } else {
        bonjour.destroy();
    }
    if (httpServer) {
        httpServer.close(() => process.exit(0));
    } else {
        process.exit(0);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
