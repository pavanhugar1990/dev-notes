import { useState, useEffect } from 'react'
import './App.css'
import 'prismjs/themes/prism.css'
import Prism from 'prismjs'

// Note type definition
interface Note {
  id: string;
  title: string;
  url?: string;
  code?: string;
  tags?: string[];
}

const TABS = ['Notes', 'Search', 'Tags', 'Web Search'] as const;
type Tab = typeof TABS[number];

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [code, setCode] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Notes')
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResult, setWebSearchResult] = useState<string | null>(null);
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  
  // Checkbox states for form fields
  const [showUrl, setShowUrl] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showTags, setShowTags] = useState(false);
  
  // States for note expansion and menu
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  // Load notes from API on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/notes')
        if (!resp.ok) throw new Error('Failed to fetch notes')
        const data: Note[] = await resp.json()
        setNotes(data)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  // Highlight code after render
  useEffect(() => {
    Prism.highlightAll();
  }, [notes, activeTab, search, selectedTag])

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      url: showUrl && url.trim() ? url.trim() : undefined,
      code: showCode && code.trim() ? code.trim() : undefined,
      tags: showTags && tagsInput.trim() ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    }

    try {
      const resp = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) throw new Error('Failed to create note')
      const created: Note = await resp.json()
      setNotes(prev => [...prev, created])
    } catch (err) {
      console.error(err)
    }

    setTitle('')
    setUrl('')
    setCode('')
    setTagsInput('')
    setShowUrl(false)
    setShowCode(false)
    setShowTags(false)
  }

  function toggleNoteExpansion(noteId: string) {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }

  function toggleMenu(noteId: string) {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.clear();
        newSet.add(noteId);
      }
      return newSet;
    });
  }

  async function deleteNote(id: string) {
    try {
      const resp = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      if (!resp.ok && resp.status !== 204) throw new Error('Failed to delete note')
      setNotes(notes.filter((n) => n.id !== id))
    } catch (err) {
      console.error(err)
    }
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }

  // Search and tag filtering
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      (note.url && note.url.toLowerCase().includes(search.toLowerCase())) ||
      (note.code && note.code.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Collect all tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  async function handleWebSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!webSearchQuery.trim()) return;
    setWebSearchLoading(true);
    setWebSearchResult(null);
    
    try {
      const abbreviationDict: Record<string, string> = {
        'API': 'Application Programming Interface',
        'HTML': 'HyperText Markup Language',
        'CSS': 'Cascading Style Sheets',
        'JS': 'JavaScript',
        'HTTP': 'HyperText Transfer Protocol',
        'HTTPS': 'HyperText Transfer Protocol Secure',
        'URL': 'Uniform Resource Locator',
        'JSON': 'JavaScript Object Notation',
        'XML': 'eXtensible Markup Language',
        'SQL': 'Structured Query Language',
        'DOM': 'Document Object Model',
        'REST': 'Representational State Transfer',
        'AJAX': 'Asynchronous JavaScript and XML',
        'JWT': 'JSON Web Token',
        'CORS': 'Cross-Origin Resource Sharing',
        'MVP': 'Minimum Viable Product',
        'UI': 'User Interface',
        'UX': 'User Experience',
        'IDE': 'Integrated Development Environment',
        'SDK': 'Software Development Kit',
        'CLI': 'Command Line Interface',
        'GUI': 'Graphical User Interface',
        'AI': 'Artificial Intelligence',
        'ML': 'Machine Learning',
        'DL': 'Deep Learning',
        'NLP': 'Natural Language Processing',
        'GPU': 'Graphics Processing Unit',
        'CPU': 'Central Processing Unit',
        'RAM': 'Random Access Memory',
        'SSD': 'Solid State Drive',
        'HDD': 'Hard Disk Drive',
        'USB': 'Universal Serial Bus',
        'WIFI': 'Wireless Fidelity',
        'LAN': 'Local Area Network',
        'WAN': 'Wide Area Network',
        'VPN': 'Virtual Private Network',
        'SSH': 'Secure Shell',
        'FTP': 'File Transfer Protocol',
        'DNS': 'Domain Name System',
        'CDN': 'Content Delivery Network',
        'CMS': 'Content Management System',
        'CRM': 'Customer Relationship Management',
        'ERP': 'Enterprise Resource Planning',
        'SaaS': 'Software as a Service',
        'PaaS': 'Platform as a Service',
        'IaaS': 'Infrastructure as a Service',
        'AWS': 'Amazon Web Services',
        'GCP': 'Google Cloud Platform',
        'Azure': 'Microsoft Azure',
        'FAQ': 'Frequently Asked Questions',
        'CEO': 'Chief Executive Officer',
        'CTO': 'Chief Technology Officer',
        'CFO': 'Chief Financial Officer',
        'HR': 'Human Resources',
        'PR': 'Public Relations',
        'ROI': 'Return on Investment',
        'KPI': 'Key Performance Indicator',
        'QA': 'Quality Assurance',
        'QC': 'Quality Control',
        'R&D': 'Research and Development',
        'B2B': 'Business to Business',
        'B2C': 'Business to Consumer',
        'SEO': 'Search Engine Optimization',
        'SEM': 'Search Engine Marketing',
        'SMM': 'Social Media Marketing',
        'CPC': 'Cost Per Click',
        'CTR': 'Click Through Rate',
        'GDPR': 'General Data Protection Regulation',
        'ISO': 'International Organization for Standardization',
        'PDF': 'Portable Document Format',
        'CSV': 'Comma Separated Values',
        'ZIP': 'Zone Improvement Plan',
        'PIN': 'Personal Identification Number',
        'ATM': 'Automated Teller Machine',
        'GPS': 'Global Positioning System',
        'LED': 'Light Emitting Diode',
        'LCD': 'Liquid Crystal Display',
        'OLED': 'Organic Light Emitting Diode',
        'HD': 'High Definition',
        '4K': '4000 pixels horizontal resolution',
        'VR': 'Virtual Reality',
        'AR': 'Augmented Reality',
        'IoT': 'Internet of Things',
        'NASA': 'National Aeronautics and Space Administration',
        'FBI': 'Federal Bureau of Investigation',
        'CIA': 'Central Intelligence Agency',
        'WHO': 'World Health Organization',
        'UN': 'United Nations',
        'EU': 'European Union',
        'NATO': 'North Atlantic Treaty Organization',
        'ASAP': 'As Soon As Possible',
        'ETA': 'Estimated Time of Arrival',
        'FYI': 'For Your Information',
        'RSVP': 'Répondez s\'il vous plaît (Please respond)',
        'YOLO': 'You Only Live Once',
        'FOMO': 'Fear of Missing Out',
        'TGIF': 'Thank God It\'s Friday',
        'DIY': 'Do It Yourself',
        'TBD': 'To Be Determined',
        'TBA': 'To Be Announced',
        'N/A': 'Not Applicable',
        'AKA': 'Also Known As',
        'PS': 'PostScript',
        'CC': 'Carbon Copy',
        'BCC': 'Blind Carbon Copy'
      };

      const upperQuery = webSearchQuery.toUpperCase();
      
      if (abbreviationDict[upperQuery]) {
        setWebSearchResult(abbreviationDict[upperQuery]);
        return;
      }

      try {
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(webSearchQuery)}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData.extract) {
            const firstSentence = wikiData.extract.split('.')[0] + '.';
            setWebSearchResult(firstSentence);
            return;
          }
        }
      } catch (wikiError) {
        console.log('Wikipedia lookup failed:', wikiError);
      }

      setWebSearchResult(`No definition found for "${webSearchQuery}". Try common abbreviations like API, HTML, CSS, JS, HTTP, AI, ML, etc.`);
      
    } catch (err) {
      setWebSearchResult(`Search failed. Try common abbreviations like API, HTML, CSS, JS, HTTP, AI, ML, etc.`);
    } finally {
      setWebSearchLoading(false);
    }
  }

  function renderNoteCard(note: Note) {
    const isExpanded = expandedNotes.has(note.id);
    const isMenuOpen = openMenus.has(note.id);

    return (
      <div key={note.id} className="note-card" style={{ textAlign: 'left', marginBottom: 16, maxWidth: 600 }}>
        <div className="note-header">
          <div 
            className="note-title" 
            onClick={() => toggleNoteExpansion(note.id)}
            style={{ cursor: 'pointer' }}
          >
            <strong>{note.title}</strong>
            <span className="expand-icon" style={{ marginLeft: 8, fontSize: '0.8em', color: '#aaa' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
          <div className="note-menu">
            <button 
              className="menu-dots"
              onClick={() => toggleMenu(note.id)}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2em' }}
            >
              ⋮
            </button>
            {isMenuOpen && (
              <div className="menu-dropdown">
                <button 
                  onClick={() => deleteNote(note.id)} 
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="note-content">
            {note.url && (
              <div style={{ marginTop: 8 }}>
                <a href={note.url} target="_blank" rel="noopener noreferrer">{note.url}</a>
              </div>
            )}
            {note.code && (
              <pre className="language-js" style={{ marginTop: 8 }}>
                <code className="language-js">{note.code}</code>
              </pre>
            )}
            {note.tags && note.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {note.tags.map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Dev Notes</h2>
        <nav>
          {TABS.map(tab => (
            <button
              key={tab}
              className={tab === activeTab ? 'active' : ''}
              onClick={() => { setActiveTab(tab); setSearch(''); setSelectedTag(null); }}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span style={{ fontSize: 12, color: '#aaa' }}>by Pavan Hugar, Vibe Coding</span>
        </div>
      </aside>
      <main className="main-content">
        {activeTab === 'Notes' && (
          <>
            <form onSubmit={addNote} className="note-form" style={{ marginBottom: 24, maxWidth: 600 }}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Note title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="title-input"
                />
              </div>
              
              <div className="form-row checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showUrl}
                    onChange={e => setShowUrl(e.target.checked)}
                  />
                  URL
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showCode}
                    onChange={e => setShowCode(e.target.checked)}
                  />
                  Code Snippet
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showTags}
                    onChange={e => setShowTags(e.target.checked)}
                  />
                  Tags
                </label>
              </div>

              {showUrl && (
                <div className="form-row">
                  <input
                    type="url"
                    placeholder="URL"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="field-input"
                  />
                </div>
              )}
              
              {showCode && (
                <div className="form-row">
                  <textarea
                    placeholder="Code snippet"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    rows={3}
                    className="field-input"
                  />
                </div>
              )}
              
              {showTags && (
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="field-input"
                  />
                </div>
              )}

              <div className="form-row">
                <button type="submit" className="add-note-btn">Add Note</button>
              </div>
            </form>
            
            <div>
              {notes.length === 0 && <p>No notes yet.</p>}
              {notes.map(renderNoteCard)}
            </div>
          </>
        )}
        {activeTab === 'Search' && (
          <div style={{ maxWidth: 600 }}>
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181818', color: '#fff' }}
            />
            <div>
              {filteredNotes.length === 0 && <p>No notes found.</p>}
              {filteredNotes.map(renderNoteCard)}
            </div>
          </div>
        )}
        {activeTab === 'Tags' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 16 }}>
              {allTags.length === 0 && <p>No tags yet.</p>}
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={selectedTag === tag ? 'tag-badge selected' : 'tag-badge'}
                  style={{ marginRight: 8, marginBottom: 8 }}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div>
              {filteredNotes.length === 0 && <p>No notes for this tag.</p>}
              {filteredNotes.map(renderNoteCard)}
            </div>
          </div>
        )}
        {activeTab === 'Web Search' && (
          <div style={{ maxWidth: 600 }}>
            <form onSubmit={handleWebSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search abbreviation or description..."
                value={webSearchQuery}
                onChange={e => setWebSearchQuery(e.target.value)}
                style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181818', color: '#fff' }}
              />
              <button type="submit" style={{ padding: '0.6em 1.2em' }} disabled={webSearchLoading}>
                {webSearchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            {webSearchResult && (
              <div className="card" style={{ fontSize: '1.1em', color: '#41d1ff', background: '#232526' }}>
                {webSearchResult}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
