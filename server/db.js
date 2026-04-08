const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'school_register.db'));

// Enable foreign key enforcement and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

/**
 * pg-compatible query wrapper so all route files work unchanged.
 * Converts PostgreSQL $1,$2,... placeholders to SQLite ?.
 */
function query(sql, params = []) {
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  const stmt = db.prepare(sqliteSql);

  const upper = sql.trim().toUpperCase();
  if (upper.startsWith('SELECT') || /\bRETURNING\b/i.test(sql)) {
    return { rows: stmt.all(params) };
  }

  const result = stmt.run(params);
  return { rows: [], rowCount: result.changes };
}

module.exports = { query, exec: (sql) => db.exec(sql) };
