import sqlite3 from 'sqlite3';
import path from 'path';

const DBSOURCE = process.env.GREL_DB_PATH || path.resolve(process.cwd(), 'grel_app.db');

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Inventory Table
        db.run(`CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            date TEXT,
            quantity INTEGER,
            costPerUnit REAL,
            type TEXT
        )`, (err) => {
            if (err) {
                // Table already created
            }
            // Migration for existing databases
            db.run(`ALTER TABLE inventory ADD COLUMN type TEXT DEFAULT 'grel'`, (err) => {
                // Ignore error if column already exists
            });
        });

        // Sales Table
        // Storing 'items' as a JSON string for simplicity
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY, 
            timestamp TEXT, 
            total REAL, 
            items TEXT
        )`, (err) => {
            if (err) {
                // Table already created
            }
        });

        // Supply Payments Table
        db.run(`CREATE TABLE IF NOT EXISTS supply_payments (
            id TEXT PRIMARY KEY, 
            date TEXT, 
            amount REAL,
            description TEXT
        )`, (err) => {
            if (err) {
                // Table already created
            }
        });

        // Debts Table (Mijozlar Nasiyasi)
        db.run(`CREATE TABLE IF NOT EXISTS debts (
            id TEXT PRIMARY KEY,
            name TEXT,
            amount REAL,
            description TEXT,
            date TEXT,
            quantity REAL DEFAULT 0
        )`, (err) => {
            if (err) {
                // Table already created
            }
            db.run(`ALTER TABLE debts ADD COLUMN quantity REAL DEFAULT 0`, (err) => {
                // Ignore error if column already exists
            });
        });

        // Expenses Table
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY, 
            date TEXT, 
            description TEXT, 
            amount REAL,
            type TEXT DEFAULT 'operating'
        )`, (err) => {
            if (err) {
                // Table already created
            } else {
                // Table just created
            }
            // Attempt to add column if it doesn't exist (for existing databases)
            // This is a simple migration strategy for this environment
            db.run(`ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'operating'`, (err) => {
                // Ignore error if column already exists
            });
        });
    }
});

export default db;
