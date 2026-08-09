const SecurityEngine = {
    sessionTimeoutSeconds: 9000, 
    timerIntervalId: null,
    selectedProfileKey: null,

    // Simulated local profile credential schemas
    profiles: {
        admin: {
            name: "Cynthia Nguhemen",
            role: "Administrator",
            password: "admin123",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
        },
        editor: {
            name: "Tall Dorcas",
            role: "Editor",
            password: "editor123",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
        }
    },

    // Step 1: Intercept choice and display password panel
    selectProfile(profileKey) {
        this.selectedProfileKey = profileKey;
        const target = this.profiles[profileKey];
        
        document.getElementById('auth-target-name').textContent = target.name;
        document.getElementById('auth-target-role').textContent = `System Privilege Level: ${target.role}`;
        document.getElementById('auth-target-avatar').src = target.avatar;
        document.getElementById('auth-error-msg').classList.add('hidden');
        document.getElementById('auth-password-input').value = '';

        document.getElementById('auth-step-identity').classList.add('hidden');
        document.getElementById('auth-step-password').classList.remove('hidden');
        document.getElementById('auth-password-input').focus();
    },

    // Step 2: Form validation handler
    handlePasswordSubmit(event) {
        event.preventDefault();
        const enteredPassword = document.getElementById('auth-password-input').value;
        const target = this.profiles[this.selectedProfileKey];
        const errorDisplay = document.getElementById('auth-error-msg');

        if (enteredPassword === target.password) {
            const payload = {
                authenticated: true,
                role: target.role,
                identity: target.name,
                avatar: target.avatar,
                tokenExpiration: Date.now() + (this.sessionTimeoutSeconds * 1000)
            };
            
            sessionStorage.setItem('sys_auth_token', JSON.stringify(payload));
            document.getElementById('auth-gate').classList.add('hidden');
            document.getElementById('app-wrapper').classList.remove('hidden');
            
            this.startSessionTimer();
            this.resetAuthWorkflow();
            renderApp();
        } else {
            errorDisplay.textContent = "Security clearance rejected: Invalid verification key signature.";
            errorDisplay.classList.remove('hidden');
            document.getElementById('auth-password-input').select();
        }
    },

    resetAuthWorkflow() {
        this.selectedProfileKey = null;
        document.getElementById('auth-step-password').classList.add('hidden');
        document.getElementById('auth-step-identity').classList.remove('hidden');
    },

    verifyAccessContext() {
        const activeToken = sessionStorage.getItem('sys_auth_token');
        if (!activeToken) return false;

        try {
            const data = JSON.parse(activeToken);
            if (Date.now() > data.tokenExpiration) {
                this.revokeSession();
                alert('Session expired. Please re-authenticate your profile parameters.');
                return false;
            }
            return data;
        } catch (e) {
            this.revokeSession();
            return false;
        }
    },

    hasPermission(requiredRole) {
        const user = this.verifyAccessContext();
        if (!user) return false;
        if (user.role === 'Administrator') return true;
        return user.role === requiredRole;
    },

    startSessionTimer() {
        if (this.timerIntervalId) clearInterval(this.timerIntervalId);
        
        const display = document.getElementById('session-timer');
        this.timerIntervalId = setInterval(() => {
            const user = JSON.parse(sessionStorage.getItem('sys_auth_token'));
            if (!user) return clearInterval(this.timerIntervalId);

            const remainingMs = user.tokenExpiration - Date.now();
            if (remainingMs <= 0) {
                clearInterval(this.timerIntervalId);
                SecurityEngine.revokeSession();
                alert('Inactivity boundary reached. Terminating administration state.');
            } else if (display) {
                const secs = Math.ceil(remainingMs / 1000);
                const mins = Math.floor(secs / 60);
                const displaySecs = secs % 60;
                display.innerHTML = `<span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> ${mins}:${displaySecs < 10 ? '0' : ''}${displaySecs}`;
            }
        }, 1000);
    },

    revokeSession() {
        if (this.timerIntervalId) clearInterval(this.timerIntervalId);
        sessionStorage.removeItem('sys_auth_token');
        const appWrapper = document.getElementById('app-wrapper');
        const authGate = document.getElementById('auth-gate');
        if (appWrapper) appWrapper.classList.add('hidden');
        if (authGate) authGate.classList.remove('hidden');
        this.resetAuthWorkflow();
    }
};

// ============================================================================
// SYSTEM DATA STATE
// ============================================================================
let state = {
    users: [
        { id: 1, name: "Cynthia Nguhemen", email: "nguhemen001@gmail.com", role: "Administrator", status: "Active" },
        { id: 2, name: "Tall Dorcas", email: "dorcasdoochian@gmail.com", role: "Editor", status: "Active" }
    ],
    posts: [
        { id: 1, title: "Getting Started with Tailwind CSS v4", category: "Engineering", status: "Published", date: "2026-05-12" },
        { id: 2, title: "The Future of Semantic HTML Architecture", category: "Technology", status: "Draft", date: "2026-05-15" }
    ],
    currentView: 'dashboard', 
    modalContext: { type: null, mode: null, targetId: null }
};

// ============================================================================
// DOM ELEMENTS SELECTORS
// ============================================================================
const elements = {
    sidebar: document.getElementById('sidebar'),
    openSidebarBtn: document.getElementById('open-sidebar'),
    closeSidebarBtn: document.getElementById('close-sidebar'),
    pageTitle: document.getElementById('page-title'),
    navItems: document.querySelectorAll('.nav-item'),
    viewUsersSection: document.getElementById('view-users'),
    viewPostsSection: document.getElementById('view-posts'),
    statUsers: document.getElementById('stat-users'),
    statPosts: document.getElementById('stat-posts'),
    userTableBody: document.getElementById('user-table-body'),
    postTableBody: document.getElementById('post-table-body'),
    modal: document.getElementById('global-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalSubmitBtn: document.getElementById('btn-submit-modal'),
    closeModalTriggers: document.querySelectorAll('.close-modal-trigger'),
    userForm: document.getElementById('form-user'),
    postForm: document.getElementById('form-post'),
    addUserBtn: document.getElementById('btn-add-user'),
    addPostBtn: document.getElementById('btn-add-post')
};

// ============================================================================
// APPLICATION LIFECYCLE
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    
    const activeSession = SecurityEngine.verifyAccessContext();
    if (activeSession) {
        if (document.getElementById('auth-gate')) document.getElementById('auth-gate').classList.add('hidden');
        if (document.getElementById('app-wrapper')) document.getElementById('app-wrapper').classList.remove('hidden');
        SecurityEngine.startSessionTimer();
        renderApp();
    } else {
        SecurityEngine.revokeSession();
    }
});

function initEvents() {
    if (elements.openSidebarBtn) elements.openSidebarBtn.addEventListener('click', () => elements.sidebar && elements.sidebar.classList.remove('-translate-x-full'));
    if (elements.closeSidebarBtn) elements.closeSidebarBtn.addEventListener('click', () => elements.sidebar && elements.sidebar.classList.add('-translate-x-full'));

    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            if (target === 'users' && !SecurityEngine.hasPermission('Administrator')) {
                alert('Access Denied: You do not hold structural privileges for User Directory context vectors.');
                return;
            }

            if (target) {
                state.currentView = target;
                renderApp();
                if (elements.sidebar) elements.sidebar.classList.add('-translate-x-full');
            }
        });
    });

    elements.closeModalTriggers.forEach(trigger => trigger.addEventListener('click', closeModal));
    if (elements.addUserBtn) {
        elements.addUserBtn.addEventListener('click', () => {
            if (!SecurityEngine.hasPermission('Administrator')) return alert('Action Revoked: Insufficient Authorization.');
            openModal('user', 'create');
        });
    }
    if (elements.addPostBtn) elements.addPostBtn.addEventListener('click', () => openModal('post', 'create'));
    if (elements.modalSubmitBtn) elements.modalSubmitBtn.addEventListener('click', handleModalSubmit);
}

// ============================================================================
// UI RENDERING & RBAC ENFORCEMENT ENGINE
// ============================================================================
function renderApp() {
    const activeUser = SecurityEngine.verifyAccessContext();
    if (!activeUser) return;

    const nameEl = document.getElementById('active-user-name');
    const badgeEl = document.getElementById('active-user-badge');
    const avatarEl = document.getElementById('active-user-avatar');

    if (nameEl) nameEl.textContent = activeUser.identity;
    if (badgeEl) badgeEl.textContent = activeUser.role;
    if (avatarEl) avatarEl.src = activeUser.avatar;

    if (elements.statUsers) elements.statUsers.textContent = state.users.length;
    if (elements.statPosts) elements.statPosts.textContent = state.posts.filter(p => p.status === 'Published').length;

    const isFullAdmin = activeUser.role === 'Administrator';
    const usersNavLink = document.getElementById('nav-users-link');
    
    if (usersNavLink) {
        if (!isFullAdmin) {
            usersNavLink.classList.add('opacity-30', 'pointer-events-none');
            if (elements.addUserBtn) elements.addUserBtn.disabled = true;
            if (state.currentView === 'users') state.currentView = 'dashboard'; 
        } else {
            usersNavLink.classList.remove('opacity-30', 'pointer-events-none');
            if (elements.addUserBtn) elements.addUserBtn.disabled = false;
        }
    }

    elements.navItems.forEach(item => {
        if(item.getAttribute('data-target') === state.currentView) {
            item.className = "nav-item active flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-600 text-white transition";
        } else {
            item.className = "nav-item flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition";
        }
    });

    if (state.currentView === 'dashboard') {
        if (elements.pageTitle) elements.pageTitle.textContent = "Dashboard Overview";
        if (elements.viewUsersSection) elements.viewUsersSection.className = isFullAdmin ? "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" : "hidden";
        if (elements.viewPostsSection) elements.viewPostsSection.classList.remove('hidden');
    } else if (state.currentView === 'users') {
        if (elements.pageTitle) elements.pageTitle.textContent = "User Directory Management";
        if (elements.viewUsersSection) elements.viewUsersSection.classList.remove('hidden');
        if (elements.viewPostsSection) elements.viewPostsSection.classList.add('hidden');
    } else if (state.currentView === 'posts') {
        if (elements.pageTitle) elements.pageTitle.textContent = "Engine Content Panel";
        if (elements.viewUsersSection) elements.viewUsersSection.classList.add('hidden');
        if (elements.viewPostsSection) elements.viewPostsSection.classList.remove('hidden');
    }

    renderUsersTable();
    renderPostsTable();
}

function renderUsersTable() {
    if (!elements.userTableBody) return;
    elements.userTableBody.innerHTML = '';
    const activeUser = SecurityEngine.verifyAccessContext();
    const isFullAdmin = activeUser && activeUser.role === 'Administrator';

    state.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50/70 transition";
        
        const statusBadge = user.status === 'Active' 
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">${user.status}</span>`
            : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">${user.status}</span>`;

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="font-semibold text-gray-900">${user.name}</div>
                <div class="text-xs text-gray-500">${user.email}</div>
            </td>
            <td class="px-6 py-4 text-gray-600 font-medium">${user.role}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button onclick="openModal('user', 'edit', ${user.id})" class="text-blue-600 hover:text-blue-900 p-1 transition cursor-pointer ${!isFullAdmin ? 'hidden' : ''}"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteItem('user', ${user.id})" class="text-red-500 hover:text-red-800 p-1 transition cursor-pointer ${!isFullAdmin ? 'hidden' : ''}"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        elements.userTableBody.appendChild(tr);
    });
}

function renderPostsTable() {
    if (!elements.postTableBody) return;
    elements.postTableBody.innerHTML = '';
    state.posts.forEach(post => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50/70 transition";

        const statusBadge = post.status === 'Published' 
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">${post.status}</span>`
            : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">${post.status}</span>`;

        tr.innerHTML = `
            <td class="px-6 py-4 font-semibold text-gray-900 max-w-xs md:max-w-md truncate">${post.title}</td>
            <td class="px-6 py-4 text-gray-600"><span class="px-2 py-1 bg-gray-100 rounded text-xs font-medium">${post.category}</span></td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-gray-500 text-xs">${post.date}</td>
            <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button onclick="openModal('post', 'edit', ${post.id})" class="text-emerald-600 hover:text-emerald-900 p-1 transition cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="deleteItem('post', ${post.id})" class="text-red-500 hover:text-red-800 p-1 transition cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        elements.postTableBody.appendChild(tr);
    });
}

// ============================================================================
// TRANSACTION OPERATIONS (MUTATION SECURITY INJECTORS)
// ============================================================================
window.openModal = function(type, mode, id = null) {
    if (type === 'user' && !SecurityEngine.hasPermission('Administrator')) {
        return alert('Action Forbidden: Requiring Administration authority clearance.');
    }

    state.modalContext = { type, mode, targetId: id };
    if (elements.userForm) elements.userForm.classList.add('hidden');
    if (elements.postForm) elements.postForm.classList.add('hidden');
    if (elements.modalSubmitBtn) elements.modalSubmitBtn.className = "px-4 py-2 text-sm font-medium text-white rounded-lg transition shadow-sm cursor-pointer";

    if (type === 'user') {
        if (elements.userForm) elements.userForm.classList.remove('hidden');
        if (elements.modalTitle) elements.modalTitle.textContent = mode === 'create' ? "Add New System User" : "Modify User Permissions";
        if (elements.modalSubmitBtn) elements.modalSubmitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        
        if (mode === 'edit') {
            const user = state.users.find(u => u.id === id);
            if(user) {
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-status').value = user.status;
            }
        } else {
            if (elements.userForm) elements.userForm.reset();
        }
    } else if (type === 'post') {
        if (elements.postForm) elements.postForm.classList.remove('hidden');
        if (elements.modalTitle) elements.modalTitle.textContent = mode === 'create' ? "Write New Article Entry" : "Modify Publishing Article";
        if (elements.modalSubmitBtn) elements.modalSubmitBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        
        if (mode === 'edit') {
            const post = state.posts.find(p => p.id === id);
            if(post) {
                document.getElementById('post-id').value = post.id;
                document.getElementById('post-title').value = post.title;
                document.getElementById('post-category').value = post.category;
                document.getElementById('post-status').value = post.status;
                document.getElementById('post-content').value = `Active secure string verification block parsing segment: ${post.id}`;
            }
        } else {
            if (elements.postForm) elements.postForm.reset();
        }
    }
    if (elements.modal) elements.modal.classList.remove('hidden');
}

function closeModal() {
    if (elements.modal) elements.modal.classList.add('hidden');
    state.modalContext = { type: null, mode: null, targetId: null };
}

function handleModalSubmit() {
    if (!SecurityEngine.verifyAccessContext()) return;
    const context = state.modalContext;
    
    if (context.type === 'user') {
        if (!SecurityEngine.hasPermission('Administrator')) return alert('Access Blocked.');
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const role = document.getElementById('user-role').value;
        const status = document.getElementById('user-status').value;

        // --- YOUR CODE CONTINUES HERE ---
        if (!name || !email) return alert('Fill empty parameters.');

        if (context.mode === 'create') {
            state.users.push({ id: Date.now(), name, email, role, status });
        } else if (context.mode === 'edit') {
            state.users = state.users.map(u => u.id === context.targetId ? { ...u, name, email, role, status } : u);
        }
    } else if (context.type === 'post') {
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-category').value.trim();
        const status = document.getElementById('post-status').value;

        if (!title || !category) return alert('Fill empty fields.');

        if (context.mode === 'create') {
            const currentDate = new Date().toISOString().split('T')[0];
            state.posts.push({ id: Date.now(), title, category, status, date: currentDate });
        } else if (context.mode === 'edit') {
            state.posts = state.posts.map(p => p.id === context.targetId ? { ...p, title, category, status } : p);
        }
    }

    closeModal();
    renderApp();
}
