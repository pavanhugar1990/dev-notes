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

  // Serve built frontend in production
  const distDir = path.resolve(__dirname, '../dist')
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir))
    app.get('/*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
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