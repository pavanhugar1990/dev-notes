import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.resolve(__dirname, '../data')
const DB_FILE = path.join(DB_DIR, 'dev-notes.sqlite')

async function start() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.resolve(__dirname, '../node_modules/sql.js/dist', file),
  })

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }

  let db
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE)
    db = new SQL.Database(new Uint8Array(fileBuffer))
  } else {
    db = new SQL.Database()
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT,
      code TEXT,
      tags TEXT
    );`)
    persist()
  }

  // Ensure latest schema exists even for existing DBs
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  );`)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );`)

  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  function persist() {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_FILE, buffer)
  }

  app.get('/api/notes', (req, res) => {
    const stmt = db.prepare('SELECT id, title, url, code, tags FROM notes ORDER BY CAST(id AS INTEGER) ASC')
    const rows = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      rows.push({
        id: String(row.id),
        title: row.title,
        url: row.url || undefined,
        code: row.code || undefined,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
      })
    }
    stmt.free()
    res.json(rows)
  })

  app.post('/api/notes', (req, res) => {
    const { title, url, code, tags } = req.body || {}
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' })
    }
    const id = Date.now().toString()
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : null
    const insert = db.prepare('INSERT INTO notes (id, title, url, code, tags) VALUES (?, ?, ?, ?, ?)')
    insert.run([id, title.trim(), url || null, code || null, tagsJson])
    insert.free()
    persist()
    res.status(201).json({ id, title: title.trim(), url: url || undefined, code: code || undefined, tags: Array.isArray(tags) ? tags : undefined })
  })

  app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params
    const del = db.prepare('DELETE FROM notes WHERE id = ?')
    del.run([id])
    del.free()
    persist()
    res.status(204).end()
  })

  // Tasks API
  app.get('/api/tasks', (req, res) => {
    const stmt = db.prepare('SELECT id, title, done, createdAt FROM tasks ORDER BY createdAt DESC')
    const rows = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      rows.push({ id: String(row.id), title: row.title, done: !!row.done, createdAt: Number(row.createdAt) })
    }
    stmt.free()
    res.json(rows)
  })

  app.post('/api/tasks', (req, res) => {
    const { title } = req.body || {}
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' })
    }
    const id = Date.now().toString()
    const createdAt = Date.now()
    const insert = db.prepare('INSERT INTO tasks (id, title, done, createdAt) VALUES (?, ?, ?, ?)')
    insert.run([id, title.trim(), 0, createdAt])
    insert.free()
    persist()
    res.status(201).json({ id, title: title.trim(), done: false, createdAt })
  })

  app.patch('/api/tasks/:id', (req, res) => {
    const { id } = req.params
    const { title, done } = req.body || {}
    const update = db.prepare('UPDATE tasks SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ?')
    const doneVal = typeof done === 'boolean' ? (done ? 1 : 0) : null
    update.run([typeof title === 'string' ? title.trim() : null, doneVal, id])
    update.free()
    persist()
    res.status(200).json({ ok: true })
  })

  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params
    const del = db.prepare('DELETE FROM tasks WHERE id = ?')
    del.run([id])
    del.free()
    persist()
    res.status(204).end()
  })

  // Settings API
  app.get('/api/settings/:key', (req, res) => {
    const { key } = req.params
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    stmt.bind([key])
    let value = null
    if (stmt.step()) {
      const row = stmt.getAsObject()
      value = row.value || null
    }
    stmt.free()
    res.json({ key, value })
  })

  app.put('/api/settings/:key', (req, res) => {
    const { key } = req.params
    const { value } = req.body || {}
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    upsert.run([key, typeof value === 'string' ? value : null])
    upsert.free()
    persist()
    res.status(200).json({ key, value: typeof value === 'string' ? value : null })
  })

  // Serve built frontend in production
  const distDir = path.resolve(__dirname, '../dist')
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir))
    // SPA fallback for any non-API GET request
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      if (req.method !== 'GET') return next()
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  const port = process.env.PORT || 3001
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
}) 