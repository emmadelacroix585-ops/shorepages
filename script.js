/* ── STATE ─────────────────────────────────────────────────── */
let db = JSON.parse(localStorage.getItem('bibliolit') || '{"books":[]}');
let currentBookId   = null;
let currentChapterIdx = 0;
let editingChapterIdx = null; // null = new chapter, number = editing existing
let readerFontSize  = 18;

let newBookEmoji = '📗';
let newBookColor = '#c8a86b';

function save() {
  localStorage.setItem('bibliolit', JSON.stringify(db));
}

/* ── THEME ─────────────────────────────────────────────────── */
(function initTheme() {
  const saved = localStorage.getItem('bibliolit-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-icon').textContent = saved === 'dark' ? '☀️' : '🌙';
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bibliolit-theme', next);
  document.getElementById('theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
}

/* ── VIEW ROUTER ───────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (name === 'home')   document.getElementById('nav-home').classList.add('active');
  if (name === 'create') document.getElementById('nav-create').classList.add('active');

  if (name === 'home')   renderHome();
  if (name === 'book')   renderBookDetail();
  if (name === 'create') resetCreateForm();

  window.scrollTo(0, 0);
}

/* ── HOME ──────────────────────────────────────────────────── */
function renderHome() {
  const grid  = document.getElementById('books-grid');
  const count = db.books.length;
  document.getElementById('books-count').textContent =
    count + (count > 1 ? ' livres' : ' livre');

  if (count === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">📖</div>
        <h3>Aucun livre pour l'instant</h3>
        <p>Créez votre premier livre pour commencer.</p>
        <button class="btn btn-primary" onclick="showView('create')">+ Créer un livre</button>
      </div>`;
    return;
  }

  grid.innerHTML = db.books.map(b => `
    <div class="book-card" onclick="openBook('${b.id}')">
      <div class="book-cover" style="background:${b.color}22">${b.emoji}</div>
      <div class="book-meta">
        <div class="book-title">${b.title}</div>
        <div class="book-author">${b.author || 'Auteur inconnu'}</div>
        <div class="book-chips">
          <span class="chip accent">${b.chapters.length} ch.</span>
        </div>
      </div>
    </div>`).join('');
}

/* ── CREATE BOOK ───────────────────────────────────────────── */
function resetCreateForm() {
  document.getElementById('new-book-title').value  = '';
  document.getElementById('new-book-author').value = '';
  document.getElementById('new-book-desc').value   = '';
  newBookEmoji = '📗';
  newBookColor = '#c8a86b';
  document.getElementById('new-emoji-selected').textContent = '📗';
  document.querySelectorAll('#new-color-picker .color-dot')
    .forEach((d,i) => d.classList.toggle('selected', i === 0));
}

function selectNewEmoji(el) {
  newBookEmoji = el.textContent;
  document.getElementById('new-emoji-selected').textContent = newBookEmoji;
}

function selectNewColor(el) {
  document.querySelectorAll('#new-color-picker .color-dot')
    .forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
  newBookColor = el.dataset.color;
}

function createBookFromForm() {
  const title = document.getElementById('new-book-title').value.trim();
  if (!title) { alert('Le titre est obligatoire.'); return; }

  const book = {
    id:       Date.now().toString(),
    title,
    author:   document.getElementById('new-book-author').value.trim(),
    desc:     document.getElementById('new-book-desc').value.trim(),
    emoji:    newBookEmoji,
    color:    newBookColor,
    chapters: []
  };
  db.books.push(book);
  save();
  currentBookId = book.id;
  showView('book');
}

/* ── BOOK DETAIL ───────────────────────────────────────────── */
function openBook(id) {
  currentBookId = id;
  showView('book');
}

function renderBookDetail() {
  const book = db.books.find(b => b.id === currentBookId);
  if (!book) { showView('home'); return; }

  document.getElementById('breadcrumb-title').textContent = book.title;
  document.getElementById('detail-cover').textContent     = book.emoji;
  document.getElementById('detail-cover').style.background = book.color + '33';
  document.getElementById('detail-title').textContent  = book.title;
  document.getElementById('detail-author').textContent = book.author ? 'par ' + book.author : '';
  document.getElementById('detail-desc').textContent   = book.desc || '';

  const list = document.getElementById('chapter-list');
  if (book.chapters.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:var(--text2);font-size:14px">
      Aucun chapitre — <button class="btn btn-primary" onclick="goToAddChapter()" style="margin-left:8px">+ Ajouter un chapitre</button>
    </div>`;
    return;
  }

  list.innerHTML = book.chapters.map((ch, i) => {
    const words = ch.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    return `
      <div class="chapter-item" onclick="readChapter(${i})">
        <span class="ch-num">Ch. ${i+1}</span>
        <span class="ch-title">${ch.title}</span>
        <span class="ch-words">${words} mots</span>
        <div class="ch-actions">
          <button class="ch-btn" onclick="event.stopPropagation(); goToEditChapter(${i})" title="Modifier">✏️</button>
          <button class="ch-btn del" onclick="event.stopPropagation(); deleteChapter(${i})" title="Supprimer">×</button>
        </div>
      </div>`;
  }).join('');
}

function deleteCurrentBook() {
  const book = db.books.find(b => b.id === currentBookId);
  if (!confirm(`Supprimer "${book.title}" et tous ses chapitres ?`)) return;
  db.books = db.books.filter(b => b.id !== currentBookId);
  save();
  showView('home');
}

/* ── CHAPTER EDITOR ────────────────────────────────────────── */
function goToAddChapter() {
  editingChapterIdx = null;
  const book = db.books.find(b => b.id === currentBookId);
  document.getElementById('editor-breadcrumb').textContent = book.title + ' — Nouveau chapitre';
  document.getElementById('chapter-title-input').value = '';
  document.getElementById('chapter-editor').innerHTML  = '';
  showView('chapter-editor');
}

function goToEditChapter(idx) {
  editingChapterIdx = idx;
  const book = db.books.find(b => b.id === currentBookId);
  const ch   = book.chapters[idx];
  document.getElementById('editor-breadcrumb').textContent =
    book.title + ' — Modifier Ch. ' + (idx+1);
  document.getElementById('chapter-title-input').value = ch.title;
  document.getElementById('chapter-editor').innerHTML  = ch.content;
  showView('chapter-editor');
}

function execCmd(cmd) {
  document.getElementById('chapter-editor').focus();
  document.execCommand(cmd, false, null);
}

function applyFont() {
  const font = document.getElementById('font-family-select').value;
  document.getElementById('chapter-editor').style.fontFamily = font;
}

function applyFontSize() {
  const size = document.getElementById('font-size-select').value;
  document.getElementById('chapter-editor').style.fontSize = size;
}

function loadTxtFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const paras = text.split(/\n\n+/).map(p =>
      '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
    document.getElementById('chapter-editor').innerHTML = paras;
    if (!document.getElementById('chapter-title-input').value) {
      document.getElementById('chapter-title-input').value =
        file.name.replace(/\.txt$/i, '');
    }
  };
  reader.readAsText(file);
}

function saveChapter() {
  const title   = document.getElementById('chapter-title-input').value.trim();
  const content = document.getElementById('chapter-editor').innerHTML.trim();
  if (!title) { alert('Le titre du chapitre est obligatoire.'); return; }

  const book = db.books.find(b => b.id === currentBookId);
  if (editingChapterIdx !== null) {
    book.chapters[editingChapterIdx] = { title, content };
  } else {
    book.chapters.push({ title, content });
  }
  save();
  showView('book');
}

function deleteChapter(idx) {
  if (!confirm('Supprimer ce chapitre ?')) return;
  const book = db.books.find(b => b.id === currentBookId);
  book.chapters.splice(idx, 1);
  save();
  renderBookDetail();
}

/* ── READER ────────────────────────────────────────────────── */
function startReading() {
  const book = db.books.find(b => b.id === currentBookId);
  if (!book || book.chapters.length === 0) {
    alert('Ajoutez au moins un chapitre d\'abord.');
    return;
  }
  readChapter(0);
}

function readChapter(idx) {
  const book = db.books.find(b => b.id === currentBookId);
  currentChapterIdx = idx;
  const ch = book.chapters[idx];

  document.getElementById('reader-book-title').textContent    = book.title;
  document.getElementById('reader-chapter-title').textContent =
    'Chapitre ' + (idx+1) + ' — ' + ch.title;

  const body = document.getElementById('reader-body');
  body.innerHTML = ch.content;
  body.style.fontSize   = readerFontSize + 'px';
  body.style.fontFamily = document.getElementById('reader-font-select').value;

  document.getElementById('chapter-counter').textContent = (idx+1) + ' / ' + book.chapters.length;
  document.getElementById('prev-chapter-btn').style.visibility = idx === 0 ? 'hidden' : 'visible';
  document.getElementById('next-chapter-btn').style.visibility =
    idx === book.chapters.length - 1 ? 'hidden' : 'visible';

  showView('reader');
  window.scrollTo(0, 0);
}

function navigateChapter(dir) {
  const book = db.books.find(b => b.id === currentBookId);
  const next = currentChapterIdx + dir;
  if (next >= 0 && next < book.chapters.length) readChapter(next);
}

function changeFontSize(d) {
  readerFontSize = Math.max(14, Math.min(26, readerFontSize + d));
  document.getElementById('reader-body').style.fontSize = readerFontSize + 'px';
}

function changeReaderFont() {
  const font = document.getElementById('reader-font-select').value;
  document.getElementById('reader-body').style.fontFamily = font;
}

/* ── INIT ──────────────────────────────────────────────────── */
renderHome();
