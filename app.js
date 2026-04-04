// ===== Inventors Hub v1.0 =====
// ================================

const S = {
    lang: localStorage.getItem('ih_lang') || 'ar',
    theme: localStorage.getItem('ih_theme') || 'light',
    user: null,
    detailInvention: null,
    invImages: [null, null, null]
};

const DB = {
    get(k) { try { return JSON.parse(localStorage.getItem('ih_' + k)) || null; } catch { return null; } },
    set(k, v) { localStorage.setItem('ih_' + k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem('ih_' + k); },
    all() {
        return {
            users: this.get('users') || [],
            inventions: this.get('inventions') || [],
            categories: this.get('categories') || [],
            favorites: this.get('favorites') || [],
            notifs: this.get('notifs') || []
        };
    }
};

const DEFAULT_CATEGORIES = [
    { id: 'cat_1', name: 'إلكترونيات', nameEn: 'Electronics', icon: 'fas fa-microchip', color: '#0EA5E9' },
    { id: 'cat_2', name: 'آلات ومعدات', nameEn: 'Machinery', icon: 'fas fa-cogs', color: '#8B5CF6' },
    { id: 'cat_3', name: 'طاقة متجددة', nameEn: 'Renewable Energy', icon: 'fas fa-solar-panel', color: '#10B981' },
    { id: 'cat_4', name: 'زراعة', nameEn: 'Agriculture', icon: 'fas fa-seedling', color: '#22C55E' },
    { id: 'cat_5', name: 'طب وصحة', nameEn: 'Medical & Health', icon: 'fas fa-heartbeat', color: '#EF4444' },
    { id: 'cat_6', name: 'تعليم', nameEn: 'Education', icon: 'fas fa-graduation-cap', color: '#F59E0B' },
    { id: 'cat_7', name: 'بناء وتشييد', nameEn: 'Construction', icon: 'fas fa-hard-hat', color: '#F97316' },
    { id: 'cat_8', name: 'نقل ومواصلات', nameEn: 'Transportation', icon: 'fas fa-car', color: '#6366F1' },
    { id: 'cat_9', name: 'برمجيات', nameEn: 'Software', icon: 'fas fa-code', color: '#EC4899' },
    { id: 'cat_10', name: 'أخرى', nameEn: 'Other', icon: 'fas fa-ellipsis-h', color: '#64748B' }
];

// ==================== LANGUAGE ====================
function applyLang() {
    document.documentElement.lang = S.lang;
    document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-ar]').forEach(el => {
        const txt = S.lang === 'ar' ? el.dataset.ar : el.dataset.en;
        if (txt) el.textContent = txt;
    });
}
function toggleLang() {
    S.lang = S.lang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('ih_lang', S.lang);
    applyLang();
    if (S.user) renderDashboard();
    renderHome();
}

// ==================== THEME ====================
function applyTheme() {
    document.documentElement.setAttribute('data-theme', S.theme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = S.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}
function toggleTheme() {
    S.theme = S.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('ih_theme', S.theme);
    applyTheme();
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    document.getElementById('navLinks').classList.remove('open');
    applyLang();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'detail') renderDetail();
    if (page === 'home') renderHome();
}

function goBack() {
    if (S.user) navigateTo('dashboard');
    else navigateTo('home');
}

function scrollToExplore() {
    const el = document.getElementById('exploreSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ==================== TOAST & MODAL ====================
function showToast(msg, type = 'info', ms = 4000) {
    const c = document.getElementById('toastContainer');
    const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<i class="fas fa-${icons[type]}"></i><span class="toast-text">${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-100%)'; setTimeout(() => t.remove(), 300); }, ms);
}

function openModal(title, body, footer) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = footer || '';
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

// ==================== UTIL ====================
function gid() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validPhone(phone, cc) {
    const len = phone.replace(/\D/g, '').length;
    const opt = document.querySelector(`option[value="${cc}"]`);
    return opt ? len === parseInt(opt.dataset.len) : len >= 7;
}
function fmtDate(d) {
    return new Date(d).toLocaleDateString(S.lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function getCat(id) {
    const d = DB.all();
    return d.categories.find(c => c.id === id) || { name: 'غير محدد', nameEn: 'Unknown', icon: 'fas fa-question', color: '#64748B' };
}
function roleLabel(role) {
    const map = { admin: { ar: 'أدمن', en: 'Admin' }, inventor: { ar: 'مخترع', en: 'Inventor' }, buyer: { ar: 'مشتري', en: 'Buyer' } };
    return (map[role] || { ar: role, en: role })[S.lang === 'ar' ? 'ar' : 'en'];
}
function statusLabel(s) {
    const map = { pending: { ar: 'قيد المراجعة', en: 'Pending' }, approved: { ar: 'مقبول', en: 'Approved' }, rejected: { ar: 'مرفوض', en: 'Rejected' }, available: { ar: 'متاح', en: 'Available' }, sold: { ar: 'مباع', en: 'Sold' }, reserved: { ar: 'محجوز', en: 'Reserved' } };
    return (map[s] || { ar: s, en: s })[S.lang === 'ar' ? 'ar' : 'en'];
}

// ==================== DEFAULT ADMIN & CATEGORIES ====================
function ensureDefaults() {
    const d = DB.all();
    if (!d.users.some(u => u.role === 'admin')) {
        d.users.push({
            id: gid(), name: 'المدير العام', email: 'admin@inventors.com', phone: '+20000000000',
            password: 'Admin@123', role: 'admin', status: 'active', createdAt: new Date().toISOString()
        });
        DB.set('users', d.users);
    }
    if (d.categories.length === 0) {
        DB.set('categories', DEFAULT_CATEGORIES);
    }
}

// ==================== NOTIFICATIONS ====================
function addNotif(uid, type, title, msg) {
    const d = DB.all();
    d.notifs.push({ id: gid(), uid, type, title, msg, read: false, date: new Date().toISOString() });
    DB.set('notifs', d.notifs);
    loadNotifs();
}
function loadNotifs() {
    if (!S.user) return;
    const d = DB.all();
    const notifs = d.notifs.filter(n => n.uid === S.user.id && !n.read);
    const badge = document.getElementById('notifBadge');
    badge.textContent = notifs.length;
    badge.classList.toggle('hidden', notifs.length === 0);
    const list = document.getElementById('notifList');
    list.innerHTML = notifs.length ? notifs.map(n => {
        const icon = n.type === 'warning' ? 'exclamation-triangle' : n.type === 'success' ? 'check-circle' : 'info-circle';
        return `<div class="notif-item" onclick="markNotif('${n.id}')"><div class="notif-icon ${n.type}"><i class="fas fa-${icon}"></i></div><div class="notif-text"><h4>${n.title}</h4><p>${n.msg}</p><div class="notif-time">${fmtDate(n.date)}</div></div></div>`;
    }).join('') : `<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>${S.lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p></div>`;
}
function markNotif(id) {
    const d = DB.all();
    const n = d.notifs.find(x => x.id === id);
    if (n) { n.read = true; DB.set('notifs', d.notifs); loadNotifs(); }
}
function clearNotifs() {
    const d = DB.all();
    d.notifs = d.notifs.filter(n => n.uid !== S.user.id);
    DB.set('notifs', d.notifs);
    loadNotifs();
}
function toggleNotifs() { document.getElementById('notifPanel').classList.toggle('hidden'); }

// ==================== AUTH ====================
function toggleAuthMode(mode) {
    document.getElementById('loginFields').classList.toggle('hidden', mode !== 'login');
    document.getElementById('registerFields').classList.toggle('hidden', mode !== 'register');
    document.getElementById('forgotFields').classList.toggle('hidden', mode !== 'forgot');
    document.getElementById('forgotPassLink').classList.toggle('hidden', mode === 'forgot');
    const t = document.getElementById('authTitle'), s = document.getElementById('authSubtitle'), b = document.getElementById('authBtnText'), l = document.getElementById('noAccountLink');
    if (mode === 'login') {
        t.dataset.ar = 'تسجيل الدخول'; t.dataset.en = 'Login';
        s.dataset.ar = 'مرحباً بك في Inventors Hub'; s.dataset.en = 'Welcome to Inventors Hub';
        b.dataset.ar = 'تسجيل الدخول'; b.dataset.en = 'Login';
        l.dataset.ar = 'ليس لديك حساب؟ سجل الآن'; l.dataset.en = "Don't have an account? Sign up";
        l.onclick = () => toggleAuthMode('register');
    } else if (mode === 'register') {
        t.dataset.ar = 'تسجيل حساب جديد'; t.dataset.en = 'Create Account';
        s.dataset.ar = 'أنشئ حسابك'; s.dataset.en = 'Create your account';
        b.dataset.ar = 'تسجيل'; b.dataset.en = 'Register';
        l.dataset.ar = 'لديك حساب؟ سجل دخول'; l.dataset.en = 'Have an account? Login';
        l.onclick = () => toggleAuthMode('login');
    } else {
        t.dataset.ar = 'نسيت كلمة المرور'; t.dataset.en = 'Forgot Password';
        s.dataset.ar = 'سنرسل لك رابط الاستعادة'; s.dataset.en = 'We will send a reset link';
        b.dataset.ar = 'إرسال'; b.dataset.en = 'Send';
        l.dataset.ar = 'العودة لتسجيل الدخول'; l.dataset.en = 'Back to Login';
        l.onclick = () => toggleAuthMode('login');
    }
    applyLang();
}

function handleAuth(e) {
    e.preventDefault();
    if (!document.getElementById('loginFields').classList.contains('hidden')) return doLogin();
    if (!document.getElementById('registerFields').classList.contains('hidden')) return doRegister();
    if (!document.getElementById('forgotFields').classList.contains('hidden')) return doForgot();
}

function doLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const d = DB.all();
    const u = d.users.find(u => u.email === email && u.password === pass);
    if (!u) { showToast(S.lang === 'ar' ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password', 'error'); return; }
    if (u.status === 'blocked') { showToast(S.lang === 'ar' ? 'حسابك محظور' : 'Account blocked', 'error'); return; }
    S.user = u; DB.set('currentUser', u);
    showToast(S.lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', 'success');
    postLogin();
}

function doRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const cc = document.getElementById('regCountryCode').value;
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;
    const role = document.querySelector('input[name="regRole"]:checked').value;
    const isAr = S.lang === 'ar';

    if (!validEmail(email)) { showToast(isAr ? 'البريد الإلكتروني غير صالح' : 'Invalid email', 'error'); return; }
    if (!validPhone(phone, cc)) { showToast(isAr ? 'رقم الموبايل غير صحيح' : 'Invalid phone', 'error'); return; }
    if (pass.length < 6) { showToast(isAr ? 'كلمة المرور قصيرة جداً' : 'Password too short', 'error'); return; }
    if (pass !== confirm) { showToast(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match', 'error'); return; }

    const d = DB.all();
    if (d.users.find(u => u.email === email)) { showToast(isAr ? 'البريد مسجل بالفعل' : 'Email already registered', 'error'); return; }

    const user = { id: gid(), name, email, phone: '+' + cc + phone, password: pass, role, status: 'active', createdAt: new Date().toISOString() };
    d.users.push(user); DB.set('users', d.users);
    S.user = user; DB.set('currentUser', user);
    showToast(isAr ? 'تم التسجيل بنجاح' : 'Registration successful', 'success');
    postLogin();
}

function doForgot() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!validEmail(email)) { showToast(S.lang === 'ar' ? 'البريد غير صالح' : 'Invalid email', 'error'); return; }
    showToast(S.lang === 'ar' ? 'تم إرسال رابط إعادة تعيين كلمة المرور' : 'Password reset link sent', 'success');
    toggleAuthMode('login');
}

function postLogin() {
    updateNav();
    navigateTo('dashboard');
    document.getElementById('notifBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    applyLang();
    renderDashboard();
    loadNotifs();
}

function updateNav() {
    const nav = document.getElementById('navLinks');
    if (!S.user) {
        nav.innerHTML = `<a href="#" onclick="navigateTo('home');return false" class="active" data-ar="الرئيسية" data-en="Home">الرئيسية</a>
            <a href="#" onclick="navigateTo('auth');return false" data-ar="تسجيل الدخول" data-en="Login">تسجيل الدخول</a>`;
        return;
    }
    const links = {
        admin: `<a href="#" onclick="navigateTo('admin');return false" class="active" data-ar="لوحة التحكم" data-en="Dashboard">لوحة التحكم</a>`,
        inventor: `<a href="#" onclick="navigateTo('inventor');return false" class="active" data-ar="لوحة المخترع" data-en="Dashboard">لوحة المخترع</a>
            <a href="#" onclick="navigateTo('home');return false" data-ar="تصفح" data-en="Browse">تصفح</a>`,
        buyer: `<a href="#" onclick="navigateTo('buyer');return false" class="active" data-ar="لوحة المشتري" data-en="Dashboard">لوحة المشتري</a>
            <a href="#" onclick="navigateTo('home');return false" data-ar="تصفح" data-en="Browse">تصفح</a>`
    };
    nav.innerHTML = links[S.user.role] || '';
}

function handleLogout() {
    S.user = null; DB.del('currentUser');
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-home').classList.remove('hidden');
    document.getElementById('notifBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('notifBadge').classList.add('hidden');
    updateNav();
    renderHome();
    showToast(S.lang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out', 'info');
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    if (!S.user) return;
    if (S.user.role === 'admin') renderAdmin();
    else if (S.user.role === 'inventor') renderInventor();
    else renderBuyer();
    applyLang();
}

// ==================== HOME PAGE ====================
function renderHome() {
    const d = DB.all();
    const approved = d.inventions.filter(i => i.status === 'approved');
    const inventors = d.users.filter(u => u.role === 'inventor').length;
    const buyers = d.users.filter(u => u.role === 'buyer').length;
    const isAr = S.lang === 'ar';

    document.getElementById('heroInvCount').textContent = approved.length;
    document.getElementById('heroInvCount2').textContent = inventors;
    document.getElementById('heroBuyCount').textContent = buyers;

    // Categories
    const catCounts = {};
    approved.forEach(inv => { catCounts[inv.category] = (catCounts[inv.category] || 0) + 1; });
    document.getElementById('categoriesGrid').innerHTML = d.categories.map(c => `
        <div class="category-card" onclick="filterByCategory('${c.id}')">
            <div class="cat-icon" style="background:${c.color}15;color:${c.color}"><i class="${c.icon}"></i></div>
            <h3>${isAr ? c.name : c.nameEn}</h3>
            <span>${catCounts[c.id] || 0} ${isAr ? 'مخترعة' : 'items'}</span>
        </div>`).join('');

    // Latest
    const latest = approved.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 9);
    document.getElementById('homeInventionsGrid').innerHTML = latest.length ? latest.map(inv => inventionCard(inv)).join('') :
        `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-sec)"><i class="fas fa-lightbulb" style="font-size:3rem;opacity:.3;display:block;margin-bottom:16px"></i><p>${isAr ? 'لا توجد مخترعات بعد' : 'No inventions yet'}</p></div>`;
}

function filterByCategory(catId) {
    if (S.user && S.user.role === 'buyer') {
        document.getElementById('buyerCatFilter').value = catId;
        searchInventions();
        navigateTo('buyer');
    } else {
        navigateTo('auth');
    }
}

function inventionCard(inv, showActions = false) {
    const cat = getCat(inv.category);
    const inventor = DB.all().users.find(u => u.id === inv.inventorId);
    const isAr = S.lang === 'ar';
    const isFav = S.user && DB.all().favorites.some(f => f.userId === S.user.id && f.inventionId === inv.id);
    const img = inv.images && inv.images[0] ? `<img src="${inv.images[0]}" alt="${inv.title}">` : `<i class="fas fa-lightbulb no-img"></i>`;

    let statusBadge = '';
    if (inv.status === 'pending') statusBadge = `<span class="card-status pending">${statusLabel('pending')}</span>`;
    else if (inv.status === 'rejected') statusBadge = `<span class="card-status rejected">${statusLabel('rejected')}</span>`;
    else if (inv.availability === 'sold') statusBadge = `<span class="card-status sold">${statusLabel('sold')}</span>`;
    else if (inv.availability === 'reserved') statusBadge = `<span class="card-status reserved">${statusLabel('reserved')}</span>`;

    const actions = showActions && S.user && S.user.role === 'buyer' ? `
        <div class="card-actions">
            <button class="btn-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation();toggleFav('${inv.id}')"><i class="fas fa-heart"></i></button>
        </div>` : '';

    return `<div class="invention-card" onclick="openInvention('${inv.id}')">
        <div class="card-img">${img}</div>
        <div class="card-body">
            <div class="card-title">${inv.title}</div>
            <div class="card-desc">${inv.description}</div>
            <div class="card-meta">
                <span class="card-cat" style="background:${cat.color}15;color:${cat.color}"><i class="${cat.icon}"></i> ${isAr ? cat.name : cat.nameEn}</span>
                ${inv.price ? `<span class="card-price">${Number(inv.price).toLocaleString()} ${isAr ? 'ج' : 'EGP'}</span>` : ''}
                ${statusBadge}
            </div>
            <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
                <span class="card-inventor"><i class="fas fa-user"></i> ${inventor ? inventor.name : '-'}</span>
                ${fmtDate(inv.date)}
            </div>
            ${actions}
        </div>
    </div>`;
}

function openInvention(id) {
    const d = DB.all();
    S.detailInvention = d.inventions.find(i => i.id === id);
    if (S.detailInvention) navigateTo('detail');
}

function renderDetail() {
    const inv = S.detailInvention;
    if (!inv) return;
    const d = DB.all();
    const cat = getCat(inv.category);
    const inventor = d.users.find(u => u.id === inv.inventorId);
    const isAr = S.lang === 'ar';
    const isFav = S.user && d.favorites.some(f => f.userId === S.user.id && f.inventionId === inv.id);

    const mainImg = inv.images && inv.images[0] ? `<img src="${inv.images[0]}" id="detailMainImg" alt="${inv.title}">` :
        `<i class="fas fa-lightbulb" style="font-size:5rem;opacity:.2"></i>`;

    const thumbs = inv.images && inv.images.length > 1 ? `<div class="detail-thumbs">${inv.images.filter(Boolean).map((img, i) =>
        `<div class="detail-thumb ${i === 0 ? 'active' : ''}" onclick="switchDetailImg('${img}', this)"><img src="${img}" alt=""></div>`
    ).join('')}</div>` : '';

    let contactBtns = '';
    if (inv.whatsapp) {
        contactBtns += `<a href="https://wa.me/${inv.whatsapp.replace(/\D/g, '')}" target="_blank" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i> ${isAr ? 'واتساب' : 'WhatsApp'}</a>`;
    }
    if (inv.contactEmail) {
        contactBtns += `<a href="mailto:${inv.contactEmail}?subject=${encodeURIComponent('استفسار عن: ' + inv.title)}" class="btn btn-email"><i class="fas fa-envelope"></i> ${isAr ? 'بريد' : 'Email'}</a>`;
    }

    document.getElementById('inventionDetail').innerHTML = `
        <div class="invention-detail">
            <button class="btn btn-secondary" onclick="goBack()" style="margin-bottom:20px"><i class="fas fa-arrow-right"></i> ${isAr ? 'رجوع' : 'Back'}</button>
            <div class="detail-gallery">
                <div class="detail-main-img">${mainImg}</div>
                ${thumbs}
            </div>
            <div class="detail-info">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
                    <h1>${inv.title}</h1>
                    ${S.user && S.user.role === 'buyer' ? `<button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav('${inv.id}')" style="width:44px;height:44px;font-size:1.1rem"><i class="fas fa-heart"></i></button>` : ''}
                </div>
                <div class="detail-badges">
                    <span class="card-cat" style="background:${cat.color}15;color:${cat.color};font-size:.85rem;padding:6px 14px"><i class="${cat.icon}"></i> ${isAr ? cat.name : cat.nameEn}</span>
                    <span class="card-status ${inv.availability || 'available'}" style="font-size:.85rem;padding:6px 14px">${statusLabel(inv.availability || 'available')}</span>
                    ${inv.price ? `<span class="card-price" style="font-size:1.2rem">${Number(inv.price).toLocaleString()} ${isAr ? 'ج.م' : 'EGP'}</span>` : ''}
                </div>
                <div class="detail-desc">${inv.description}</div>
                <div class="detail-meta-grid">
                    <div class="detail-meta-item"><i class="fas fa-user"></i><div><div class="meta-label">${isAr ? 'المخترع' : 'Inventor'}</div><div class="meta-value">${inventor ? inventor.name : '-'}</div></div></div>
                    <div class="detail-meta-item"><i class="fas fa-calendar"></i><div><div class="meta-label">${isAr ? 'تاريخ النشر' : 'Published'}</div><div class="meta-value">${fmtDate(inv.date)}</div></div></div>
                    ${inv.patent ? `<div class="detail-meta-item"><i class="fas fa-certificate"></i><div><div class="meta-label">${isAr ? 'براءة الاختراع' : 'Patent'}</div><div class="meta-value">${inv.patent}</div></div></div>` : ''}
                </div>
                ${contactBtns ? `<div class="detail-contact">${contactBtns}</div>` : ''}
            </div>
        </div>`;
}

function switchDetailImg(src, el) {
    document.getElementById('detailMainImg').src = src;
    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

// ==================== FAVORITES ====================
function toggleFav(invId) {
    if (!S.user || S.user.role !== 'buyer') return;
    const d = DB.all();
    const idx = d.favorites.findIndex(f => f.userId === S.user.id && f.inventionId === invId);
    if (idx >= 0) {
        d.favorites.splice(idx, 1);
        showToast(S.lang === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites', 'info');
    } else {
        d.favorites.push({ userId: S.user.id, inventionId: invId });
        showToast(S.lang === 'ar' ? 'تمت الإضافة للمفضلة' : 'Added to favorites', 'success');
    }
    DB.set('favorites', d.favorites);
    if (S.user.role === 'buyer') renderBuyer();
    if (S.detailInvention) renderDetail();
}

// ==================== ADMIN ====================
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    document.getElementById('tabContent-' + tab).classList.remove('hidden');
    if (tab === 'inventions') renderAdminInventions();
    if (tab === 'users') renderAdminUsers();
    if (tab === 'categories') renderAdminCategories();
}

function renderAdmin() {
    navigateTo('admin');
    const d = DB.all();
    const isAr = S.lang === 'ar';
    const inventors = d.users.filter(u => u.role === 'inventor');
    const buyers = d.users.filter(u => u.role === 'buyer');
    const pending = d.inventions.filter(i => i.status === 'pending');

    document.getElementById('adminStats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-lightbulb"></i></div><div class="stat-info"><h3>${d.inventions.length}</h3><p>${isAr ? 'إجمالي المخترعات' : 'Total Inventions'}</p></div></div>
        <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-flask"></i></div><div class="stat-info"><h3>${inventors.length}</h3><p>${isAr ? 'المخترعين' : 'Inventors'}</p></div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><h3>${buyers.length}</h3><p>${isAr ? 'المشترين' : 'Buyers'}</p></div></div>
        <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div><div class="stat-info"><h3>${pending.length}</h3><p>${isAr ? 'قيد المراجعة' : 'Pending'}</p></div></div>`;

    renderAdminInventions();
}

function renderAdminInventions() {
    const d = DB.all();
    const filter = document.getElementById('adminInvFilter').value;
    const isAr = S.lang === 'ar';
    const pkgNames = {};
    d.categories.forEach(c => pkgNames[c.id] = isAr ? c.name : c.nameEn);

    let invs = d.inventions;
    if (filter !== 'all') invs = invs.filter(i => i.status === filter);

    document.getElementById('adminInvBody').innerHTML = invs.length ? invs.sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv, i) => {
        const inventor = d.users.find(u => u.id === inv.inventorId);
        const cat = getCat(inv.category);
        const img = inv.images && inv.images[0] ? `<img src="${inv.images[0]}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">` : '-';
        return `<tr>
            <td>${i + 1}</td><td>${img}</td><td>${inv.title}</td>
            <td><span class="badge badge-primary">${isAr ? cat.name : cat.nameEn}</span></td>
            <td>${inventor ? inventor.name : '-'}</td>
            <td><span class="card-status ${inv.status}">${statusLabel(inv.status)}</span></td>
            <td>${fmtDate(inv.date)}</td>
            <td class="actions">
                ${inv.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="approveInvention('${inv.id}')"><i class="fas fa-check"></i></button>
                <button class="btn btn-sm btn-danger" onclick="rejectInvention('${inv.id}')"><i class="fas fa-times"></i></button>` : ''}
                <button class="btn btn-sm btn-secondary" onclick="openInvention('${inv.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteInvention('${inv.id}')"><i class="fas fa-trash"></i></button>
            </td></tr>`;
    }).join('') : `<tr><td colspan="8" style="text-align:center">${isAr ? 'لا توجد بيانات' : 'No data'}</td></tr>`;
}

function approveInvention(id) {
    const d = DB.all();
    const inv = d.inventions.find(i => i.id === id);
    if (!inv) return;
    inv.status = 'approved';
    inv.availability = 'available';
    DB.set('inventions', d.inventions);
    addNotif(inv.inventorId, 'success', S.lang === 'ar' ? 'تم قبول المخترعة' : 'Invention Approved', inv.title);
    showToast(S.lang === 'ar' ? 'تم قبول المخترعة' : 'Invention approved', 'success');
    renderAdminInventions();
}

function rejectInvention(id) {
    const isAr = S.lang === 'ar';
    openModal(isAr ? 'رفض المخترعة' : 'Reject Invention',
        `<div class="form-group"><label>${isAr ? 'سبب الرفض' : 'Reason'}</label><textarea id="rejectReason" class="form-control" rows="3" placeholder="${isAr ? 'أدخل السبب' : 'Enter reason'}"></textarea></div>`,
        `<button class="btn btn-danger" onclick="confirmRejectInv('${id}')"><i class="fas fa-times"></i> ${isAr ? 'رفض' : 'Reject'}</button>
         <button class="btn btn-secondary" onclick="closeModal()">${isAr ? 'إلغاء' : 'Cancel'}</button>`);
}

function confirmRejectInv(id) {
    const d = DB.all();
    const inv = d.inventions.find(i => i.id === id);
    if (!inv) return;
    const reason = document.getElementById('rejectReason').value.trim();
    inv.status = 'rejected';
    inv.rejectReason = reason;
    DB.set('inventions', d.inventions);
    addNotif(inv.inventorId, 'warning', S.lang === 'ar' ? 'تم رفض المخترعة' : 'Invention Rejected', `${inv.title} — ${reason || '-'}`);
    closeModal();
    showToast(S.lang === 'ar' ? 'تم الرفض' : 'Rejected', 'success');
    renderAdminInventions();
}

function deleteInvention(id) {
    const isAr = S.lang === 'ar';
    openModal(isAr ? 'تأكيد الحذف' : 'Confirm Delete', `<p>${isAr ? 'سيتم حذف المخترعة نهائياً' : 'Invention will be permanently deleted'}</p>`,
        `<button class="btn btn-danger" onclick="confirmDeleteInv('${id}')"><i class="fas fa-trash"></i> ${isAr ? 'حذف' : 'Delete'}</button>
         <button class="btn btn-secondary" onclick="closeModal()">${isAr ? 'إلغاء' : 'Cancel'}</button>`);
}

function confirmDeleteInv(id) {
    const d = DB.all();
    d.inventions = d.inventions.filter(i => i.id !== id);
    d.favorites = d.favorites.filter(f => f.inventionId !== id);
    DB.set('inventions', d.inventions);
    DB.set('favorites', d.favorites);
    closeModal();
    showToast(S.lang === 'ar' ? 'تم الحذف' : 'Deleted', 'success');
    renderAdminInventions();
}

function renderAdminUsers() {
    const d = DB.all();
    const isAr = S.lang === 'ar';
    const users = d.users.filter(u => u.role !== 'admin');
    document.getElementById('adminUsersBody').innerHTML = users.length ? users.map((u, i) => `<tr>
        <td>${i + 1}</td><td>${u.name}</td><td>${u.email}</td>
        <td><span class="badge ${u.role === 'inventor' ? 'badge-primary' : 'badge-success'}">${roleLabel(u.role)}</span></td>
        <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'محظور' : 'Blocked')}</span></td>
        <td>${fmtDate(u.createdAt)}</td>
        <td class="actions">
            <button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}" onclick="toggleUserStatus('${u.id}')">${u.status === 'active' ? (isAr ? 'حظر' : 'Block') : (isAr ? 'تفعيل' : 'Activate')}</button>
        </td></tr>`).join('') : `<tr><td colspan="7" style="text-align:center">${isAr ? 'لا يوجد مستخدمين' : 'No users'}</td></tr>`;
}

function toggleUserStatus(id) {
    const d = DB.all();
    const u = d.users.find(u => u.id === id);
    if (!u) return;
    u.status = u.status === 'active' ? 'blocked' : 'active';
    DB.set('users', d.users);
    showToast(S.lang === 'ar' ? 'تم تغيير الحالة' : 'Status changed', 'success');
    renderAdminUsers();
}

function renderAdminCategories() {
    const d = DB.all();
    const isAr = S.lang === 'ar';
    document.getElementById('adminCategoriesGrid').innerHTML = d.categories.map(c => `
        <div class="cat-admin-card">
            <div class="cat-info">
                <div class="cat-icon-sm" style="background:${c.color}15;color:${c.color}"><i class="${c.icon}"></i></div>
                <strong>${isAr ? c.name : c.nameEn}</strong>
            </div>
            <button class="btn-icon" onclick="deleteCategory('${c.id}')" style="color:var(--danger)"><i class="fas fa-trash"></i></button>
        </div>`).join('');
}

function showAddCategoryModal() {
    const isAr = S.lang === 'ar';
    openModal(isAr ? 'إضافة تصنيف' : 'Add Category', `
        <div class="form-group"><label>${isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</label><input type="text" id="newCatName" class="form-control" placeholder="الاسم بالعربي"></div>
        <div class="form-group"><label>${isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label><input type="text" id="newCatNameEn" class="form-control" placeholder="Name in English"></div>
        <div class="form-group"><label>Icon (Font Awesome)</label><input type="text" id="newCatIcon" class="form-control" value="fas fa-lightbulb" placeholder="fas fa-lightbulb"></div>
        <div class="form-group"><label>${isAr ? 'اللون' : 'Color'}</label><input type="color" id="newCatColor" class="form-control" value="#0EA5E9" style="height:50px"></div>`,
        `<button class="btn btn-primary" onclick="addCategory()"><i class="fas fa-plus"></i> ${isAr ? 'إضافة' : 'Add'}</button>
         <button class="btn btn-secondary" onclick="closeModal()">${isAr ? 'إلغاء' : 'Cancel'}</button>`);
}

function addCategory() {
    const name = document.getElementById('newCatName').value.trim();
    const nameEn = document.getElementById('newCatNameEn').value.trim();
    const icon = document.getElementById('newCatIcon').value.trim();
    const color = document.getElementById('newCatColor').value;
    if (!name || !nameEn) { showToast(S.lang === 'ar' ? 'أدخل الاسم' : 'Enter name', 'error'); return;
    }
    const d = DB.all();
    d.categories.push({ id: gid(), name, nameEn, icon, color });
    DB.set('categories', d.categories);
    closeModal();
    showToast(S.lang === 'ar' ? 'تمت الإضافة' : 'Added', 'success');
    renderAdminCategories();
}

function deleteCategory(id) {
    const d = DB.all();
    d.categories = d.categories.filter(c => c.id !== id);
    DB.set('categories', d.categories);
    showToast(S.lang === 'ar' ? 'تم الحذف' : 'Deleted', 'success');
    renderAdminCategories();
}

// ==================== INVENTOR ====================
function renderInventor() {
    navigateTo('inventor');
    const d = DB.all();
    const isAr = S.lang === 'ar';
    const myInvs = d.inventions.filter(i => i.inventorId === S.user.id);
    const approved = myInvs.filter(i => i.status === 'approved');
    const pending = myInvs.filter(i => i.status === 'pending');

    // Populate category select
    const sel = document.getElementById('invCategory');
    sel.innerHTML = `<option value="" data-ar="اختر التصنيف" data-en="Select Category">${isAr ? 'اختر التصنيف' : 'Select Category'}</option>` +
        d.categories.map(c => `<option value="${c.id}">${isAr ? c.name : c.nameEn}</option>`).join('');

    document.getElementById('inventorStats').innerHTML = `
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-lightbulb"></i></div><div class="stat-info"><h3>${myInvs.length}</h3><p>${isAr ? 'إجمالي مخترعاتي' : 'Total'}</p></div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><h3>${approved.length}</h3><p>${isAr ? 'مقبول' : 'Approved'}</p></div></div>
        <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div><div class="stat-info"><h3>${pending.length}</h3><p>${isAr ? 'قيد المراجعة' : 'Pending'}</p></div></div>`;

    document.getElementById('myInventionsGrid').innerHTML = myInvs.length ? myInvs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => inventionCard(inv)).join('') :
        `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-sec)"><i class="fas fa-lightbulb" style="font-size:2.5rem;opacity:.3;display:block;margin-bottom:12px"></i><p>${isAr ? 'لم تضف أي مخترعة بعد' : 'No inventions yet'}</p></div>`;
}

function addInvention(e) {
    e.preventDefault();
    const isAr = S.lang === 'ar';
    const title = document.getElementById('invTitle').value.trim();
    const category = document.getElementById('invCategory').value;
    const description = document.getElementById('invDescription').value.trim();
    const price = document.getElementById('invPrice').value;
    const patent = document.getElementById('invPatent').value.trim();
    const whatsapp = document.getElementById('invWhatsApp').value.trim();
    const contactEmail = document.getElementById('invContactEmail').value.trim();

    if (!title || !category || !description) { showToast(isAr ? 'جميع الحقول المطلوبة' : 'All fields required', 'error'); return false; }

    const images = S.invImages.filter(Boolean);
    const inv = {
        id: gid(), title, category, description,
        price: price ? Number(price) : null,
        patent: patent || null,
        whatsapp: whatsapp || null,
        contactEmail: contactEmail || null,
        images, inventorId: S.user.id,
        status: 'pending', availability: 'available',
        date: new Date().toISOString()
    };
    const d = DB.all();
    d.inventions.push(inv);
    DB.set('inventions', d.inventions);

    // Notify admin
    const admin = d.users.find(u => u.role === 'admin');
    if (admin) addNotif(admin.id, 'info', isAr ? 'مخترعة جديدة' : 'New Invention', `${S.user.name} — ${title}`);

    showToast(isAr ? 'تم إرسال المخترعة للمراجعة' : 'Submitted for review', 'success');
    e.target.reset();
    S.invImages = [null, null, null];
    for (let i = 0; i < 3; i++) {
        document.getElementById('slot' + i).classList.remove('hidden');
        document.getElementById('preview' + i).classList.add('hidden');
        document.getElementById('invImg' + (i + 1)).value = '';
    }
    renderDashboard();
    return false;
}

function handleInvImage(input, idx) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast(S.lang === 'ar' ? 'حجم الصورة كبير' : 'Image too large', 'error'); input.value = ''; return; }
    if (!file.type.startsWith('image/')) { showToast(S.lang === 'ar' ? 'صورة فقط' : 'Images only', 'error'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = function (e) {
        S.invImages[idx] = e.target.result;
        document.getElementById('slot' + idx).classList.add('hidden');
        document.getElementById('preview' + idx).classList.remove('hidden');
        document.getElementById('imgPrev' + idx).src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeInvImage(e, idx) {
    e.stopPropagation();
    S.invImages[idx] = null;
    document.getElementById('invImg' + (idx + 1)).value = '';
    document.getElementById('slot' + idx).classList.remove('hidden');
    document.getElementById('preview' + idx).classList.add('hidden');
}

// ==================== BUYER ====================
function renderBuyer() {
    navigateTo('buyer');
    const d = DB.all();
    const isAr = S.lang === 'ar';
    const favs = d.favorites.filter(f => f.userId === S.user.id);
    const favInvs = favs.map(f => d.inventions.find(i => i.id === f.inventionId)).filter(Boolean);

    document.getElementById('buyerStats').innerHTML = `
        <div class="stat-card"><div class="stat-icon green"><i class="fas fa-heart"></i></div><div class="stat-info"><h3>${favs.length}</h3><p>${isAr ? 'المفضلة' : 'Favorites'}</p></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-lightbulb"></i></div><div class="stat-info"><h3>${d.inventions.filter(i => i.status === 'approved').length}</h3><p>${isAr ? 'إجمالي المخترعات' : 'Total Inventions'}</p></div></div>`;

    // Populate category filter
    const catSel = document.getElementById('buyerCatFilter');
    catSel.innerHTML = `<option value="" data-ar="كل التصنيفات" data-en="All Categories">${isAr ? 'كل التصنيفات' : 'All Categories'}</option>` +
        d.categories.map(c => `<option value="${c.id}">${isAr ? c.name : c.nameEn}</option>`).join('');

    searchInventions();

    document.getElementById('favoritesGrid').innerHTML = favInvs.length ? favInvs.map(inv => inventionCard(inv, true)).join('') :
        `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-sec)"><p>${isAr ? 'لا توجد مفضلة' : 'No favorites'}</p></div>`;
}

function searchInventions() {
    const q = (document.getElementById('buyerSearch')?.value || '').toLowerCase();
    const cat = document.getElementById('buyerCatFilter')?.value || '';
    const d = DB.all();
    let invs = d.inventions.filter(i => i.status === 'approved');
    if (q) invs = invs.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    if (cat) invs = invs.filter(i => i.category === cat);
    invs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const isAr = S.lang === 'ar';
    document.getElementById('buyerInventionsGrid').innerHTML = invs.length ? invs.map(inv => inventionCard(inv, true)).join('') :
        `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-sec)"><i class="fas fa-search" style="font-size:3rem;opacity:.3;display:block;margin-bottom:16px"></i><p>${isAr ? 'لا توجد نتائج' : 'No results'}</p></div>`;
}

// ==================== LEGAL ====================
function renderLegal(page) {
    const isAr = S.lang === 'ar';
    const content = {
        privacy: {
            ar: `<h1>سياسة الخصوصية</h1><p class="highlight">آخر تحديث: أبريل 2026</p>
<h2>1. المعلومات التي نجمعها</h2><p>نجمع: الاسم، البريد الإلكتروني، رقم الهاتف، وبيانات المخترعات التي تضيفها.</p>
<h2>2. كيفية الاستخدام</h2><ul><li>تقديم خدمة عرض المخترعات</li><li>تسهيل التواصل بين المخترعين والمشترين</li><li>تحسين المنصة</li></ul>
<h2>3. مشاركة البيانات</h2><ul><li>معلومات المخترعات تكون عامة للجميع</li><li>لا نبيع بياناتك لأطراف ثالثة</li></ul>
<h2>4. حقوقك</h2><ul><li>الوصول لبياناتك وتعديلها</li><li>طلب حذف حسابك</li></ul>
<h2>5. اتصل بنا</h2><p>للأي استفسار تواصل معنا عبر المنصة.</p>`,
            en: `<h1>Privacy Policy</h1><p class="highlight">Last updated: April 2026</p>
<h2>1. Information Collected</h2><p>We collect: name, email, phone, and invention data you add.</p>
<h2>2. How We Use It</h2><ul><li>Providing invention showcase service</li><li>Facilitating inventor-buyer communication</li><li>Improving the platform</li></ul>
<h2>3. Data Sharing</h2><ul><li>Invention info is public to all users</li><li>We don't sell your data to third parties</li></ul>
<h2>4. Your Rights</h2><ul><li>Access and modify your data</li><li>Request account deletion</li></ul>
<h2>5. Contact</h2><p>For any inquiries, contact us through the platform.</p>`
        },
        terms: {
            ar: `<h1>الشروط والأحكام</h1><p class="highlight">آخر تحديث: أبريل 2026</p>
<h2>1. القبول</h2><p>باستخدام المنصة فإنك توافق على هذه الشروط.</p>
<h2>2. الحسابات</h2><p>أنت مسؤول عن حسابك وكل نشاط يتم من خلاله.</p>
<h2>3. المحتوى</h2><p>يجب أن تكون المخترعات حقيقية وليست مضللة. يحق لنا إزالة أي محتوى مخالف.</p>
<h2>4. السلوك</h2><p>يُمنع الاحتيال أو الانتحال أو نشر محتوى مسيء.</p>
<h2>5. الملكية الفكرية</h2><p>أنت تملك حقوق مخترعاتك. تمنحنا ترخيصاً لعرضها على المنصة.</p>
<h2>6. إخلاء المسؤولية</h2><p>المنصة "كما هي" بدون ضمانات. لسنا طرفاً في أي صفقة بين مستخدمينا.</p>`,
            en: `<h1>Terms & Conditions</h1><p class="highlight">Last updated: April 2026</p>
<h2>1. Acceptance</h2><p>By using the platform you agree to these terms.</p>
<h2>2. Accounts</h2><p>You are responsible for your account and all activity through it.</p>
<h2>3. Content</h2><p>Inventions must be real and not misleading. We reserve the right to remove violating content.</p>
<h2>4. Conduct</h2><p>Fraud, impersonation, and abusive content are prohibited.</p>
<h2>5. IP</h2><p>You own your inventions. You grant us a license to display them.</p>
<h2>6. Disclaimer</h2><p>The platform is "as is" without warranties. We are not party to any deal between users.</p>`
        }
    };
    const el = document.getElementById(page + 'Content');
    if (el && content[page]) el.innerHTML = content[page][isAr ? 'ar' : 'en'];
}

// ==================== TOGGLE PASS ====================
function togglePass(id) {
    const inp = document.getElementById(id);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    inp.parentElement.querySelector('.toggle-pass i').className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// ==================== INIT ====================
function init() {
    ensureDefaults();
    applyTheme();
    applyLang();
    updateNav();

    window.addEventListener('scroll', () => {
        document.getElementById('backToTop').classList.toggle('hidden', window.scrollY < 300);
    });

    const saved = DB.get('currentUser');
    if (saved) {
        const d = DB.all();
        const found = d.users.find(u => u.id === saved.id);
        if (found && found.status !== 'blocked') { S.user = found; postLogin(); }
        else { DB.del('currentUser'); renderHome(); }
    } else {
        renderHome();
    }

    setTimeout(() => {
        document.getElementById('splash').classList.add('fade-out');
        document.getElementById('app').classList.remove('hidden');
        setTimeout(() => document.getElementById('splash').remove(), 600);
    }, 1500);
}

document.addEventListener('DOMContentLoaded', init);
