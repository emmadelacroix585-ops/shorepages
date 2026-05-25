// INITIALISATION DES DONNÉES
let appData = JSON.parse(localStorage.getItem('biblioLitData')) || { password: null, books: [] };
let currentBookId = null;
let currentChapterIndex = null;
let currentFontSize = 18;

// DOM ELEMENTS
const authScreen = document.getElementById('auth-screen');
const mainInterface = document.getElementById('main-interface');
const authForm = document.getElementById('auth-form');
const authPasswordInput = document.getElementById('auth-password');
const authMessage = document.getElementById('auth-message');
const themeToggle = document.getElementById('theme-toggle');

// GESTION DU MOT DE PASSE ET ACCÈS
if (appData.password) {
    authMessage.textContent = "Entrez votre mot de passe pour accéder à vos livres :";
    document.getElementById('auth-submit-btn').textContent = "Se connecter";
}

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputPassword = authPasswordInput.value;

    if (!appData.password) {
        // Configuration initiale
        appData.password = inputPassword;
        saveData();
        unlockApp();
    } else {
        // Vérification
        if (appData.password === inputPassword) {
            unlockApp();
        } else {
            alert("Mot de passe incorrect ❌");
            authPasswordInput.value = '';
        }
    }
});

function unlockApp() {
    authScreen.classList.add('hidden');
    authScreen.classList.remove('active-screen');
    mainInterface.classList.remove('hidden');
    renderLibrary();
}

function saveData() {
    localStorage.setItem('biblioLitData', JSON.stringify(appData));
}

// GESTION DU THÈME
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
});

// NAVIGATION ENTRE SECTIONS
function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (sectionId === 'library') {
        document.getElementById('sec-library').classList.remove('hidden');
        document.getElementById('nav-library').classList.add('active');
        renderLibrary();
    } else if (sectionId === 'create-book') {
        document.getElementById('sec-create-book').classList.remove('hidden');
        document.getElementById('nav-create').classList.add('active');
    } else if (sectionId === 'book-details') {
        document.getElementById('sec-book-details').classList.remove('hidden');
    } else if (sectionId === 'add-chapter') {
        document.getElementById('sec-add-chapter').classList.remove('hidden');
    } else if (sectionId === 'reader') {
        document.getElementById('sec-reader').classList.remove('hidden');
    }
}

// ÉDITEUR ENRICHI (FONCTIONS DE MISE EN FORME)
function formatText(command) {
    document.execCommand(command, false, null);
}
function changeEditorFont() {
    const font = document.getElementById('editor-font').value;
    document.getElementById('chap-content').style.fontFamily = font;
}

// GESTION DU LIVRE : CRÉATION
document.getElementById('form-create-book').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value || "Auteur inconnu";
    const desc = document.getElementById('book-desc').value || "Aucune description fournie.";
    
    const newBook = {
        id: Date.now().toString(),
        title: title,
        author: author,
        desc: desc,
        chapters: []
    };

    appData.books.push(newBook);
    saveData();
    document.getElementById('form-create-book').reset();
    showSection('library');
});

// AFFICHAGE BIBLIOTHÈQUE
function renderLibrary() {
    const grid = document.getElementById('books-grid');
    grid.innerHTML = '';

    if (appData.books.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Aucun livre pour le moment. Cliquez sur "Créer un livre" pour commencer !</p>`;
        return;
    }

    appData.books.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.innerHTML = `
            <h3>📖 ${book.title}</h3>
            <p class="author">Par ${book.author}</p>
            <p class="description">${book.desc}</p>
        `;
        card.onclick = () => openBookDetails(book.id);
        grid.appendChild(card);
    });
}

// VOIR LES DÉTAILS D'UN LIVRE
function openBookDetails(bookId) {
    currentBookId = bookId;
    const book = appData.books.find(b => b.id === bookId);
    
    document.getElementById('detail-book-title').textContent = book.title;
    document.getElementById('detail-book-author').textContent = `Par ${book.author}`;
    document.getElementById('detail-book-desc').textContent = book.desc;

    // Boutons d'actions
    document.getElementById('btn-trigger-add-chap').onclick = () => {
        document.getElementById('form-add-chapter').reset();
        document.getElementById('chap-content').innerHTML = '';
        showSection('add-chapter');
    };
    document.getElementById('btn-back-to-book').onclick = () => openBookDetails(bookId);
    document.getElementById('btn-delete-book').onclick = () => deleteBook(bookId);

    // Liste chapitres
    const list = document.getElementById('chapters-list');
    list.innerHTML = '';

    if (book.chapters.length === 0) {
        list.innerHTML = `<p style="padding: 15px; color: var(--text-secondary);">Aucun chapitre dans ce livre.</p>`;
    } else {
        book.chapters.forEach((chap, index) => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerHTML = `<span>${chap.title}</span> <small style="color:var(--text-secondary);">Lire →</small>`;
            item.onclick = () => openReader(index);
            list.appendChild(item);
        });
    }
    showSection('book-details');
}

// CRÉATION DE CHAPITRE
document.getElementById('form-add-chapter').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('chap-title').value;
    const content = document.getElementById('chap-content').innerHTML; // Récupère le HTML mis en forme

    const book = appData.books.find(b => b.id === currentBookId);
    book.chapters.push({ title, content });
    
    saveData();
    openBookDetails(currentBookId);
});

// SUPPRIMER UN LIVRE
function deleteBook(bookId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce livre ?")) {
        appData.books = appData.books.filter(b => b.id !== bookId);
        saveData();
        showSection('library');
    }
}

// LE LECTEUR
function openReader(chapterIndex) {
    const book = appData.books.find(b => b.id === currentBookId);
    currentChapterIndex = chapterIndex;
    const chapter = book.chapters[chapterIndex];

    document.getElementById('reader-chap-title').textContent = chapter.title;
    document.getElementById('reader-content').innerHTML = chapter.content;
    document.getElementById('reader-back-to-book').onclick = () => openBookDetails(currentBookId);

    // Navigation Chapitres
    const prevBtn = document.getElementById('btn-prev-chap');
    const nextBtn = document.getElementById('btn-next-chap');

    prevBtn.disabled = chapterIndex === 0;
    nextBtn.disabled = chapterIndex === book.chapters.length - 1;

    prevBtn.onclick = () => openReader(chapterIndex - 1);
    nextBtn.onclick = () => openReader(chapterIndex + 1);

    showSection('reader');
}

// COMMANDES DU LECTEUR
function adjustFontSize(amount) {
    currentFontSize += amount;
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 36) currentFontSize = 36;
    document.getElementById('reader-content').style.fontSize = `${currentFontSize}px`;
}

function changeReaderFont() {
    const font = document.getElementById('reader-font-select').value;
    document.getElementById('reader-content').style.fontFamily = font;
}