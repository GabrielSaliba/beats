const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, 'counter.db')

const db = new sqlite3.Database(DB_PATH)

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS counter (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total INTEGER NOT NULL
    )
  `)

  db.run(`
    INSERT OR IGNORE INTO counter (id, total)
    VALUES (1, 0)
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS user_counter (
      user_id TEXT PRIMARY KEY,
      name TEXT,
      total INTEGER NOT NULL
    )
  `)
})

module.exports = db