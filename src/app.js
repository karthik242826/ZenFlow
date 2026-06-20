/**
 * ZenFlow - Main Application logic
 */

// Initialize Database singleton
const db = window.db;

// Application State Cache
const state = {
  view: 'dashboard', // current view: dashboard, timetable, todo, notes
  theme: 'midnight',
  timetable: [],
  todos: [],
  notes: [],
  history: [], // Cached history log entries
  todoFilter: 'all', // all, pending, completed
  searchQuery: '',
  autosaveTimeout: null
};

// Colors mapping for note background styling
const noteColorClasses = {
  default: 'note-default',
  pink: 'note-pink',
  blue: 'note-blue',
  green: 'note-green',
  yellow: 'note-yellow',
  purple: 'note-purple',
  orange: 'note-orange'
};

// Days of the week list
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// DOM Elements
const DOM = {
  // Navigation
  navItems: document.querySelectorAll('.sidebar-nav .nav-item'),
  views: document.querySelectorAll('.view-section'),
  dashboardSchedule: document.getElementById('dashboard-schedule-container'),
  dashboardNotes: document.getElementById('dashboard-notes-container'),
  dashboardTodos: document.getElementById('dashboard-todos-container'),
  dashboardHistory: document.getElementById('dashboard-history-container'),
  
  // Dashboard Action buttons
  actionBtns: document.querySelectorAll('[data-go-to-view]'),
  
  // Stats
  statEvents: document.getElementById('stat-events'),
  statTasks: document.getElementById('stat-tasks'),
  statNotes: document.getElementById('stat-notes'),
  
  // Themes
  themeBtns: document.querySelectorAll('[data-set-theme]'),
  
  // Clock
  clockTime: document.getElementById('clock-time'),
  clockDate: document.getElementById('clock-date'),
  greetingText: document.getElementById('greeting-text'),
  
  // Global search
  globalSearch: document.getElementById('global-search'),
  
  // Timetable
  timetableMatrix: document.getElementById('timetable-matrix'),
  btnAddEvent: document.getElementById('btn-add-event'),
  eventModal: document.getElementById('event-modal'),
  eventModalTitle: document.getElementById('event-modal-title'),
  eventModalClose: document.getElementById('event-modal-close'),
  eventModalCancel: document.getElementById('event-modal-cancel'),
  eventForm: document.getElementById('event-form'),
  eventId: document.getElementById('event-id'),
  eventTitleInput: document.getElementById('event-title-input'),
  eventDayInput: document.getElementById('event-day-input'),
  eventCategoryInput: document.getElementById('event-category-input'),
  eventStartInput: document.getElementById('event-start-input'),
  eventEndInput: document.getElementById('event-end-input'),
  eventLocationInput: document.getElementById('event-location-input'),
  
  // To-Do
  todoForm: document.getElementById('todo-form'),
  todoTitle: document.getElementById('todo-title'),
  todoPriority: document.getElementById('todo-priority'),
  todoDue: document.getElementById('todo-due'),
  todoCategory: document.getElementById('todo-category'),
  todoTabBtns: document.querySelectorAll('.todo-tab'),
  todoListContainer: document.getElementById('todo-list-container'),
  
  // Notes
  notesCardsContainer: document.getElementById('notes-cards-container'),
  btnAddNote: document.getElementById('btn-add-note'),
  noteModal: document.getElementById('note-modal'),
  noteModalTitle: document.getElementById('note-modal-title'),
  noteModalClose: document.getElementById('note-modal-close'),
  noteModalDelete: document.getElementById('note-modal-delete'),
  noteModalPin: document.getElementById('note-modal-pin'),
  noteForm: document.getElementById('note-form'),
  noteId: document.getElementById('note-id'),
  noteTitleInput: document.getElementById('note-title-input'),
  noteContentInput: document.getElementById('note-content-input'),
  noteTagsInput: document.getElementById('note-tags-input'),
  noteSaveStatus: document.getElementById('note-save-status'),
  noteColorOptions: document.querySelectorAll('.note-color-option'),
  
  // Database buttons
  btnExport: document.getElementById('btn-export'),
  btnImportTrigger: document.getElementById('btn-import-trigger'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  dbFileInput: document.getElementById('db-file-input'),
  
  // Notification Toast
  toast: document.getElementById('toast-notif'),
  toastIcon: document.getElementById('toast-icon'),
  toastMsg: document.getElementById('toast-message'),

  // Cloud Sync Settings
  btnCloudSettings: document.getElementById('btn-cloud-settings'),
  cloudModal: document.getElementById('cloud-modal'),
  cloudModalClose: document.getElementById('cloud-modal-close'),
  tabCloudConfig: document.getElementById('tab-cloud-config'),
  tabCloudAuth: document.getElementById('tab-cloud-auth'),
  panelCloudConfig: document.getElementById('panel-cloud-config'),
  panelCloudAuth: document.getElementById('panel-cloud-auth'),
  cloudApiKey: document.getElementById('cloud-api-key'),
  cloudProjectId: document.getElementById('cloud-project-id'),
  cloudAuthDomain: document.getElementById('cloud-auth-domain'),
  cloudMessagingId: document.getElementById('cloud-messaging-id'),
  cloudAppId: document.getElementById('cloud-app-id'),
  btnCloudSave: document.getElementById('btn-cloud-save'),
  btnCloudClear: document.getElementById('btn-cloud-clear'),
  cloudLoginForm: document.getElementById('cloud-login-form'),
  cloudEmail: document.getElementById('cloud-email'),
  cloudPassword: document.getElementById('cloud-password'),
  btnCloudRegister: document.getElementById('btn-cloud-register'),
  cloudAuthSignedOut: document.getElementById('cloud-auth-signed-out'),
  cloudAuthSignedIn: document.getElementById('cloud-auth-signed-in'),
  cloudUserEmail: document.getElementById('cloud-user-email'),
  btnCloudLogout: document.getElementById('btn-cloud-logout'),
  cloudStatusBadge: document.getElementById('cloud-status-badge'),
  cloudStatusDot: document.getElementById('cloud-status-dot'),
  cloudStatusText: document.getElementById('cloud-status-text')
};

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = 'success') {
  DOM.toastMsg.innerText = message;
  
  // Set icon according to notification status
  if (type === 'success') {
    DOM.toastIcon.className = 'fa-solid fa-circle-check notification-icon';
    DOM.toastIcon.style.color = 'var(--priority-low)';
    DOM.toast.style.borderLeftColor = 'var(--priority-low)';
  } else if (type === 'error') {
    DOM.toastIcon.className = 'fa-solid fa-triangle-exclamation notification-icon';
    DOM.toastIcon.style.color = 'var(--priority-high)';
    DOM.toast.style.borderLeftColor = 'var(--priority-high)';
  } else {
    DOM.toastIcon.className = 'fa-solid fa-circle-info notification-icon';
    DOM.toastIcon.style.color = 'var(--accent-color)';
    DOM.toast.style.borderLeftColor = 'var(--accent-color)';
  }
  
  DOM.toast.classList.add('active');
  
  // Hide toast after 3.5 seconds
  setTimeout(() => {
    DOM.toast.classList.remove('active');
  }, 3500);
}

/* ==========================================================================
   APP INITIALIZATION & DATA LOADING
   ========================================================================== */
/* ==========================================================================
   SPLASH / LOGIN SCREEN CONTROLLER
   ========================================================================== */
function showSplashError(msg) {
  const el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideSplashError() {
  const el = document.getElementById('login-error');
  if (el) el.style.display = 'none';
}

function setSplashLoading(loading) {
  const btn = document.getElementById('splash-signin-btn');
  const gBtn = document.getElementById('splash-google-btn');
  if (btn) btn.textContent = loading ? 'Signing in...' : 'Sign In';
  if (btn) btn.disabled = loading;
  if (gBtn) gBtn.disabled = loading;
}

function enterApp() {
  const splash = document.getElementById('login-splash');
  const mainApp = document.getElementById('main-app');
  if (splash) {
    splash.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.03)';
    setTimeout(() => { splash.style.display = 'none'; }, 500);
  }
  if (mainApp) mainApp.style.display = '';
}

function setupSplashListeners() {
  // Google sign-in
  const splashGoogleBtn = document.getElementById('splash-google-btn');
  if (splashGoogleBtn) {
    splashGoogleBtn.addEventListener('click', async () => {
      hideSplashError();
      setSplashLoading(true);
      try {
        await window.firebaseSync.signInWithGoogle();
        // handleAuthStateChanged will call enterApp
      } catch (err) {
        setSplashLoading(false);
        if (err.code !== 'auth/popup-closed-by-user') {
          showSplashError(err.message || 'Google sign-in failed.');
        }
      }
    });
  }

  // Email/password sign in
  const splashForm = document.getElementById('splash-login-form');
  if (splashForm) {
    splashForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideSplashError();
      const email = document.getElementById('splash-email').value.trim();
      const password = document.getElementById('splash-password').value;
      if (!email || !password) {
        showSplashError('Please enter your email and password.');
        return;
      }
      setSplashLoading(true);
      try {
        await window.firebaseSync.signIn(email, password);
        // handleAuthStateChanged will call enterApp
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            await window.firebaseSync.signUp(email, password);
          } catch (signUpErr) {
            setSplashLoading(false);
            showSplashError(signUpErr.message || 'Registration failed.');
          }
        } else {
          setSplashLoading(false);
          showSplashError(err.message || 'Sign in failed.');
        }
      }
    });
  }

  // Create account button
  const splashRegisterBtn = document.getElementById('splash-register-btn');
  if (splashRegisterBtn) {
    splashRegisterBtn.addEventListener('click', async () => {
      hideSplashError();
      const email = document.getElementById('splash-email').value.trim();
      const password = document.getElementById('splash-password').value;
      if (!email || !password) {
        showSplashError('Please enter an email and password to register.');
        return;
      }
      if (password.length < 6) {
        showSplashError('Password must be at least 6 characters.');
        return;
      }
      setSplashLoading(true);
      try {
        await window.firebaseSync.signUp(email, password);
        // handleAuthStateChanged will call enterApp
      } catch (err) {
        setSplashLoading(false);
        showSplashError(err.message || 'Registration failed.');
      }
    });
  }

  // Skip button → local mode
  const splashSkipBtn = document.getElementById('splash-skip-btn');
  if (splashSkipBtn) {
    splashSkipBtn.addEventListener('click', () => {
      enterApp();
      showToast('Running in local mode — data stays on this device.', 'info');
    });
  }

  // Sidebar Sign In button → show splash again
  const btnSidebarSignin = document.getElementById('btn-sidebar-signin');
  if (btnSidebarSignin) {
    btnSidebarSignin.addEventListener('click', () => {
      const splash = document.getElementById('login-splash');
      const mainApp = document.getElementById('main-app');
      if (splash) {
        splash.style.transition = 'opacity 0.4s ease';
        splash.style.opacity = '1';
        splash.style.transform = 'scale(1)';
        splash.style.display = 'flex';
      }
      if (mainApp) mainApp.style.display = 'none';
    });
  }

  // Sidebar Sign Out button
  const btnSidebarSignout = document.getElementById('btn-sidebar-signout');
  if (btnSidebarSignout) {
    btnSidebarSignout.addEventListener('click', async () => {
      if (confirm('Sign out of your cloud workspace? Local data will be preserved.')) {
        try {
          await window.firebaseSync.signOut();
          showToast('Signed out successfully.');
          // Show splash again for next sign-in
          const splash = document.getElementById('login-splash');
          const mainApp = document.getElementById('main-app');
          if (splash) {
            splash.style.opacity = '1';
            splash.style.transform = 'scale(1)';
            splash.style.display = 'flex';
          }
          if (mainApp) mainApp.style.display = 'none';
        } catch (err) {
          showToast('Sign out failed.', 'error');
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize IndexedDB
    await db.init();
    
    // 2. Setup theme from LocalStorage
    const cachedTheme = localStorage.getItem('zenflow-theme') || 'midnight';
    setTheme(cachedTheme);
    
    // 3. Load database data
    await reloadData();
    
    // 4. Start real-time system clock
    startClock();
    
    // 5. Setup UI Event Listeners
    setupEventListeners();

    // 5b. Initialize Firebase Sync Configuration
    initFirebaseSync();

    // 5c. Setup splash screen listeners
    setupSplashListeners();
    
    // 6. Draw UI views
    renderAll();
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showToast('Database failed to initialize.', 'error');
  }
});

/**
 * Reloads all database stores into local app state
 */
async function reloadData() {
  state.timetable = await db.getAll('timetable');
  state.todos = await db.getAll('todos');
  state.notes = await db.getAll('notes');
  state.history = await db.getAll('history');
}

/**
 * Renders stats and views
 */
function renderAll() {
  updateStats();
  renderTimetable();
  renderTodos();
  renderNotes();
  renderDashboard();
  renderHistory();
}

/**
 * Global stats updates in Sidebar
 */
function updateStats() {
  const todayName = momentDayName(new Date().getDay());
  
  // Today's schedule events count
  const todayEvents = state.timetable.filter(item => item.day === todayName).length;
  DOM.statEvents.innerText = todayEvents;
  
  // Active incomplete tasks count
  const activeTasks = state.todos.filter(item => !item.completed).length;
  DOM.statTasks.innerText = activeTasks;
  
  // Pinned notes count
  const pinnedNotes = state.notes.filter(item => item.pinned).length;
  DOM.statNotes.innerText = pinnedNotes;
}

// Convert Date.getDay() (0 = Sunday, 1 = Monday) to local array layout
function momentDayName(dayIndex) {
  const index = dayIndex === 0 ? 6 : dayIndex - 1; // Map Sunday (0) to index 6, Monday (1) to index 0
  return DAYS_OF_WEEK[index];
}

/* ==========================================================================
   CLOCK & TIME SERVICES
   ========================================================================== */
function startClock() {
  const IST = 'Asia/Kolkata';

  const updateTime = () => {
    const now = new Date();

    // 12-hour time in IST
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: IST
    });
    DOM.clockTime.innerText = timeStr.toUpperCase(); // e.g. "11:45:30 PM"

    // Date in IST
    const dateStr = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: IST
    });
    DOM.clockDate.innerText = dateStr;

    // Greeting based on IST hour
    const istHour = parseInt(
      now.toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: IST })
    );
    if (istHour < 12) {
      DOM.greetingText.innerText = 'Good Morning,';
    } else if (istHour < 18) {
      DOM.greetingText.innerText = 'Good Afternoon,';
    } else {
      DOM.greetingText.innerText = 'Good Evening,';
    }
  };

  updateTime();
  setInterval(updateTime, 1000);
}

/* ==========================================================================
   THEME SWITCHING SERVICES
   ========================================================================== */
function setTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('zenflow-theme', themeName);
  
  DOM.themeBtns.forEach(btn => {
    if (btn.getAttribute('data-set-theme') === themeName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/* ==========================================================================
   ROUTING & NAVIGATION LOGIC
   ========================================================================== */
function switchView(viewName) {
  state.view = viewName;
  
  // Set navigation tabs status
  DOM.navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Display target view section container
  DOM.views.forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Re-run render function for the chosen view to refresh lists
  renderAll();
}

/* ==========================================================================
   DASHBOARD VIEW RENDER
   ========================================================================== */
function renderDashboard() {
  const searchLower = state.searchQuery.toLowerCase();
  const todayName = momentDayName(new Date().getDay());
  const todayIndex = DAYS_OF_WEEK.indexOf(todayName);
  
  // Helper to calculate day distance from today
  const getDayDistance = (dayName) => {
    const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
    if (dayIndex === -1) return 99;
    if (dayIndex >= todayIndex) {
      return dayIndex - todayIndex;
    } else {
      return (7 - todayIndex) + dayIndex;
    }
  };

  DOM.dashboardSchedule.innerHTML = '';
  
  let displayedEvents = [];
  let isSearchActive = !!state.searchQuery;
  
  if (isSearchActive) {
    // If searching, search ALL timetable events globally
    displayedEvents = state.timetable.filter(e => 
      e.title.toLowerCase().includes(searchLower) || 
      (e.location && e.location.toLowerCase().includes(searchLower)) ||
      e.category.toLowerCase().includes(searchLower) ||
      e.day.toLowerCase().includes(searchLower)
    );
    // Sort search results by day distance from today, then by start time
    displayedEvents.sort((a, b) => {
      const distA = getDayDistance(a.day);
      const distB = getDayDistance(b.day);
      if (distA !== distB) return distA - distB;
      return a.startTime.localeCompare(b.startTime);
    });
  } else {
    // If not searching, get today's events
    displayedEvents = state.timetable.filter(e => e.day === todayName);
    displayedEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  
  if (displayedEvents.length === 0) {
    if (isSearchActive) {
      DOM.dashboardSchedule.innerHTML = `
        <div class="dashboard-schedule-empty">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--text-muted);"></i>
          No matching classes or events found.
        </div>
      `;
    } else {
      // Today is empty, show empty state message
      DOM.dashboardSchedule.innerHTML = `
        <div class="dashboard-schedule-empty">
          <i class="fa-solid fa-moon" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--text-muted);"></i>
          No classes scheduled for today.
        </div>
      `;
      
      // Look for upcoming events scheduled on other days
      const otherEvents = state.timetable.filter(e => e.day !== todayName);
      if (otherEvents.length > 0) {
        otherEvents.sort((a, b) => {
          const distA = getDayDistance(a.day);
          const distB = getDayDistance(b.day);
          if (distA !== distB) return distA - distB;
          return a.startTime.localeCompare(b.startTime);
        });
        
        // Render section header and cards for upcoming events
        const upcomingContainer = document.createElement('div');
        upcomingContainer.className = 'upcoming-schedule-section';
        upcomingContainer.style.marginTop = '1.25rem';
        upcomingContainer.style.borderTop = '1px solid var(--border-color)';
        upcomingContainer.style.paddingTop = '1rem';
        
        upcomingContainer.innerHTML = `
          <h4 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.75rem; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-arrow-right-long" style="color: var(--accent-color);"></i> Coming Up Next
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
        `;
        
        const listDiv = upcomingContainer.querySelector('div');
        
        otherEvents.slice(0, 3).forEach(event => {
          const card = document.createElement('div');
          card.className = 'mini-event-card';
          card.style.borderLeftColor = getCategoryColor(event.category);
          
          const badgeStyle = `background: ${getCategoryColor(event.category)}15; color: ${getCategoryColor(event.category)};`;
          
          card.innerHTML = `
            <div class="mini-event-details">
              <span class="mini-event-title">${escapeHTML(event.title)}</span>
              <div class="mini-event-meta">
                <span style="font-weight: 600; color: var(--accent-color);"><i class="fa-regular fa-calendar"></i> ${event.day}</span>
                <span><i class="fa-regular fa-clock"></i> ${event.startTime} - ${event.endTime}</span>
              </div>
            </div>
            <span class="mini-event-category" style="${badgeStyle}">${event.category}</span>
          `;
          
          card.addEventListener('click', () => {
            openEventModal(event);
          });
          
          listDiv.appendChild(card);
        });
        
        DOM.dashboardSchedule.appendChild(upcomingContainer);
      }
    }
  } else {
    displayedEvents.forEach(event => {
      const card = document.createElement('div');
      card.className = 'mini-event-card';
      card.style.borderLeftColor = getCategoryColor(event.category);
      
      const badgeStyle = `background: ${getCategoryColor(event.category)}15; color: ${getCategoryColor(event.category)};`;
      const dayMetaHTML = isSearchActive 
        ? `<span style="font-weight: 600; color: var(--accent-color);"><i class="fa-regular fa-calendar"></i> ${event.day}</span>` 
        : '';
        
      card.innerHTML = `
        <div class="mini-event-details">
          <span class="mini-event-title">${escapeHTML(event.title)}</span>
          <div class="mini-event-meta">
            ${dayMetaHTML}
            <span><i class="fa-regular fa-clock"></i> ${event.startTime} - ${event.endTime}</span>
            ${event.location ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHTML(event.location)}</span>` : ''}
          </div>
        </div>
        <span class="mini-event-category" style="${badgeStyle}">${event.category}</span>
      `;
      
      card.addEventListener('click', () => {
        openEventModal(event);
      });
      
      DOM.dashboardSchedule.appendChild(card);
    });
  }
  
  // 2. Load urgent Tasks list (Incomplete, sorted by Priority High -> Medium -> Low, then by Due Date)
  let pendingTasks = state.todos.filter(t => !t.completed);
  
  if (state.searchQuery) {
    pendingTasks = pendingTasks.filter(t => t.title.toLowerCase().includes(searchLower) || (t.category && t.category.toLowerCase().includes(searchLower)));
  }
  
  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
  pendingTasks.sort((a, b) => {
    const valA = priorityWeight[a.priority] || 0;
    const valB = priorityWeight[b.priority] || 0;
    if (valB !== valA) return valB - valA;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  
  DOM.dashboardTodos.innerHTML = '';
  if (pendingTasks.length === 0) {
    DOM.dashboardTodos.innerHTML = `
      <div class="dashboard-todos-empty">
        <i class="fa-solid fa-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--priority-low);"></i>
        Hooray! No urgent tasks pending.
      </div>
    `;
  } else {
    pendingTasks.slice(0, 5).forEach(task => { // Limit dashboard preview to top 5
      const card = createTaskRowElement(task);
      DOM.dashboardTodos.appendChild(card);
    });
  }
  
  // 3. Load Pinned notes preview cards
  let pinnedNotes = state.notes.filter(n => n.pinned);
  
  if (state.searchQuery) {
    pinnedNotes = pinnedNotes.filter(n => n.title.toLowerCase().includes(searchLower) || n.content.toLowerCase().includes(searchLower) || (n.tags && n.tags.some(t => t.toLowerCase().includes(searchLower))));
  }
  
  pinnedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
  
  DOM.dashboardNotes.innerHTML = '';
  if (pinnedNotes.length === 0) {
    DOM.dashboardNotes.innerHTML = `
      <div class="dashboard-notes-empty" style="grid-column: span 2;">
        <i class="fa-solid fa-thumbtack" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; color: var(--text-muted);"></i>
        Pin important notes to display them here.
      </div>
    `;
  } else {
    pinnedNotes.slice(0, 4).forEach(note => { // Limit dashboard preview to top 4
      const card = createNoteCardElement(note);
      DOM.dashboardNotes.appendChild(card);
    });
  }
}

/* ==========================================================================
   TIMETABLE VIEW PLANNER SERVICES
   ========================================================================== */
function renderTimetable() {
  DOM.timetableMatrix.innerHTML = '';
  const searchLower = state.searchQuery.toLowerCase();
  
  const todayName = momentDayName(new Date().getDay());
  
  DAYS_OF_WEEK.forEach(day => {
    const col = document.createElement('div');
    col.className = `day-column ${day === todayName ? 'current-day' : ''}`;
    
    // Header for the column day
    const isTodayBadge = day === todayName ? ' <span class="day-subtitle">(Today)</span>' : '';
    col.innerHTML = `
      <div class="day-header">
        <h4 class="day-name">${day}</h4>
        <span class="day-subtitle">${getEventCountForDay(day)} Events</span>
      </div>
      <div class="event-cards-container" id="events-col-${day}"></div>
    `;
    
    DOM.timetableMatrix.appendChild(col);
    
    const eventsContainer = col.querySelector(`#events-col-${day}`);
    
    // Load events matching day, then sort chronologically
    let dayEvents = state.timetable.filter(e => e.day === day);
    
    if (state.searchQuery) {
      dayEvents = dayEvents.filter(e => e.title.toLowerCase().includes(searchLower) || (e.location && e.location.toLowerCase().includes(searchLower)));
    }
    
    dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (dayEvents.length === 0) {
      eventsContainer.innerHTML = `
        <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); text-align: center; border: 1px dashed var(--border-color); border-radius: 12px; padding: 1.5rem 0.5rem; margin-top: 0.5rem;">
          No events
        </div>
      `;
    } else {
      dayEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        const catColor = getCategoryColor(event.category);
        eventCard.style.borderLeftColor = catColor;
        
        const badgeStyle = `background: ${catColor}15; color: ${catColor};`;
        
        eventCard.innerHTML = `
          <div class="event-card-header">
            <h5 class="event-card-title">${escapeHTML(event.title)}</h5>
            <i class="fa-solid fa-trash-can event-delete-btn" title="Remove schedule item" data-id="${event.id}"></i>
          </div>
          <span class="event-time"><i class="fa-regular fa-clock" style="margin-right: 0.25rem;"></i>${event.startTime} - ${event.endTime}</span>
          ${event.location ? `<span class="event-location"><i class="fa-solid fa-location-dot"></i>${escapeHTML(event.location)}</span>` : ''}
          <span class="event-category-badge" style="${badgeStyle}">${event.category}</span>
        `;
        
        // Trash icon click
        eventCard.querySelector('.event-delete-btn').addEventListener('click', async (e) => {
          e.stopPropagation(); // Avoid opening modal
          if (confirm('Delete this event from your schedule?')) {
            await db.delete('timetable', event.id);
            if (window.firebaseSync && window.firebaseSync.currentUser) {
              await window.firebaseSync.deleteFromCloud('timetable', event.id);
            }
            await logHistory('deleted', 'timetable', event.title);
            await reloadData();
            renderAll();
            showToast('Event removed from timetable');
          }
        });
        
        // Card click to edit
        eventCard.addEventListener('click', () => {
          openEventModal(event);
        });
        
        eventsContainer.appendChild(eventCard);
      });
    }
  });
}

function getEventCountForDay(dayName) {
  return state.timetable.filter(e => e.day === dayName).length;
}

function getCategoryColor(category) {
  switch (category) {
    case 'Class': return '#8b5cf6'; // Violet
    case 'Exam': return '#ff4757'; // Sunset red
    case 'Lab': return '#00d2d3'; // Teal
    case 'Study': return '#ffa502'; // Orange
    case 'Personal': return '#2ed573'; // Green
    default: return 'var(--accent-color)';
  }
}

// Modal helper controls for scheduler
function openEventModal(event = null) {
  DOM.eventForm.reset();
  
  if (event) {
    DOM.eventModalTitle.innerText = 'Edit Schedule Item';
    DOM.eventId.value = event.id;
    DOM.eventTitleInput.value = event.title;
    DOM.eventDayInput.value = event.day;
    DOM.eventCategoryInput.value = event.category;
    DOM.eventStartInput.value = event.startTime;
    DOM.eventEndInput.value = event.endTime;
    DOM.eventLocationInput.value = event.location || '';
  } else {
    DOM.eventModalTitle.innerText = 'Add Event to Schedule';
    DOM.eventId.value = '';
    
    // Default to the current day if adding from planner view
    const todayName = momentDayName(new Date().getDay());
    DOM.eventDayInput.value = todayName;
  }
  
  DOM.eventModal.classList.add('active');
}

function closeEventModal() {
  DOM.eventModal.classList.remove('active');
}

/* ==========================================================================
   TIMETABLE CONFLICT DETECTOR
   ========================================================================== */
function hasOverlapConflict(newEvent) {
  // Overlap occurs if on the same day:
  // start1 < end2 AND start2 < end1
  const sameDayEvents = state.timetable.filter(e => e.day === newEvent.day && e.id !== newEvent.id);
  
  for (const event of sameDayEvents) {
    if (newEvent.startTime < event.endTime && event.startTime < newEvent.endTime) {
      return event; // Returns the conflicting event object
    }
  }
  return null;
}

/* ==========================================================================
   TO-DO MANAGER SYSTEM SERVICES
   ========================================================================== */
function renderTodos() {
  DOM.todoListContainer.innerHTML = '';
  const searchLower = state.searchQuery.toLowerCase();
  
  // Filter items in state matching active tab
  let filtered = state.todos;
  if (state.todoFilter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (state.todoFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }
  
  if (state.searchQuery) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(searchLower) || (t.category && t.category.toLowerCase().includes(searchLower)));
  }
  
  // Sort: Incomplete tasks first, then sort by Priority High -> Medium -> Low, then by Due Date
  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    const valA = priorityWeight[a.priority] || 0;
    const valB = priorityWeight[b.priority] || 0;
    if (valB !== valA) return valB - valA;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  
  if (filtered.length === 0) {
    DOM.todoListContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 4rem 1.5rem;">
        <i class="fa-solid fa-list-check" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-muted); display: block;"></i>
        No tasks matching this filter view.
      </div>
    `;
  } else {
    filtered.forEach(task => {
      const row = createTaskRowElement(task);
      DOM.todoListContainer.appendChild(row);
    });
  }
}

function createTaskRowElement(task) {
  const row = document.createElement('div');
  row.className = `todo-item ${task.completed ? 'completed' : ''}`;
  
  const formattedDate = task.dueDate ? formatDate(task.dueDate) : 'No due date';
  const categoryIcon = getCategoryIcon(task.category);
  
  row.innerHTML = `
    <div class="todo-item-left">
      <div class="custom-checkbox" title="Toggle progress state">
        ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
      </div>
      <div>
        <span class="todo-item-title">${escapeHTML(task.title)}</span>
        <div class="todo-meta">
          <span><i class="${categoryIcon}"></i>${task.category || 'General'}</span>
          <span><i class="fa-regular fa-calendar"></i>${formattedDate}</span>
        </div>
      </div>
    </div>
    
    <div class="todo-item-right">
      <span class="priority-pill ${task.priority.toLowerCase()}">${task.priority}</span>
      <i class="fa-regular fa-trash-can todo-delete-btn" title="Delete task"></i>
    </div>
  `;
  
  // Custom checkbox trigger toggle state
  row.querySelector('.custom-checkbox').addEventListener('click', async () => {
    task.completed = !task.completed;
    await db.update('todos', task);
    if (window.firebaseSync && window.firebaseSync.currentUser) {
      await window.firebaseSync.pushToCloud('todos', task);
    }
    await logHistory(task.completed ? 'completed' : 'toggled_incomplete', 'todo', task.title);
    await reloadData();
    renderAll();
    
    if (task.completed) {
      showToast('Task marked as completed!');
    } else {
      showToast('Task set back to pending.');
    }
  });
  
  // Delete action button click
  row.querySelector('.todo-delete-btn').addEventListener('click', async () => {
    if (confirm('Delete this task?')) {
      await db.delete('todos', task.id);
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.deleteFromCloud('todos', task.id);
      }
      await logHistory('deleted', 'todo', task.title);
      await reloadData();
      renderAll();
      showToast('Task successfully deleted.');
    }
  });
  
  return row;
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Study': return 'fa-solid fa-graduation-cap';
    case 'Work': return 'fa-solid fa-briefcase';
    case 'Health': return 'fa-solid fa-heart-pulse';
    case 'Personal': return 'fa-solid fa-user';
    default: return 'fa-solid fa-tags';
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  const options = { month: 'short', day: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}

/* ==========================================================================
   NOTES SYSTEM & AUTOSAVE DESK
   ========================================================================== */
function renderNotes() {
  DOM.notesCardsContainer.innerHTML = '';
  const searchLower = state.searchQuery.toLowerCase();
  
  // Filter notes
  let filtered = state.notes;
  
  if (state.searchQuery) {
    filtered = filtered.filter(n => n.title.toLowerCase().includes(searchLower) || n.content.toLowerCase().includes(searchLower) || (n.tags && n.tags.some(t => t.toLowerCase().includes(searchLower))));
  }
  
  // Sort: Pinned notes to the top, then by last updated timestamp
  filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
  
  if (filtered.length === 0) {
    DOM.notesCardsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 5rem 1.5rem;">
        <i class="fa-solid fa-note-sticky" style="font-size: 3rem; margin-bottom: 0.75rem; color: var(--text-muted); display: block;"></i>
        No notes found. Create a new note to start writing!
      </div>
    `;
  } else {
    filtered.forEach(note => {
      const card = createNoteCardElement(note);
      DOM.notesCardsContainer.appendChild(card);
    });
  }
}

function createNoteCardElement(note) {
  const card = document.createElement('div');
  const cardBgClass = noteColorClasses[note.color] || 'note-default';
  
  card.className = `note-card ${cardBgClass} ${note.pinned ? 'pinned-note' : ''}`;
  
  const tagsHTML = note.tags && note.tags.length > 0 
    ? note.tags.map(t => `<span class="note-tag">${escapeHTML(t)}</span>`).join('') 
    : '';
    
  const pinClass = note.pinned ? 'pin-active' : '';
  const pinIcon = note.pinned ? 'fa-solid fa-thumbtack' : 'fa-solid fa-thumbtack';
  
  card.innerHTML = `
    <div class="note-card-header">
      <h4 class="note-card-title">${escapeHTML(note.title) || 'Untitled Note'}</h4>
      <div class="note-card-actions">
        <i class="note-act-btn ${pinClass} fa-solid fa-thumbtack" title="Pin note" data-action="pin"></i>
        <i class="note-act-btn fa-solid fa-trash" title="Delete note" data-action="delete"></i>
      </div>
    </div>
    
    <div class="note-card-body">
      ${escapeHTML(note.content) || '<span style="font-style:italic; opacity: 0.5;">No content...</span>'}
    </div>
    
    <div class="note-card-footer">
      <div class="note-tags">${tagsHTML}</div>
      <span>${formatNoteDate(note.updatedAt)}</span>
    </div>
  `;
  
  // Note actions triggers
  card.querySelector('[data-action="pin"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    await db.update('notes', note);
    if (window.firebaseSync && window.firebaseSync.currentUser) {
      await window.firebaseSync.pushToCloud('notes', note);
    }
    await logHistory(note.pinned ? 'pinned' : 'unpinned', 'notes', note.title);
    await reloadData();
    renderAll();
    showToast(note.pinned ? 'Note pinned to top' : 'Note unpinned');
  });
  
  card.querySelector('[data-action="delete"]').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm('Permanently delete this note?')) {
      await db.delete('notes', note.id);
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.deleteFromCloud('notes', note.id);
      }
      await logHistory('deleted', 'notes', note.title);
      await reloadData();
      renderAll();
      showToast('Note deleted');
    }
  });
  
  // Click on card to open in modal editor
  card.addEventListener('click', () => {
    openNoteModal(note);
  });
  
  return card;
}

function formatNoteDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Modal helper controls for Note Editing
function openNoteModal(note = null) {
  DOM.noteForm.reset();
  DOM.noteSaveStatus.innerText = 'Saved';
  
  // Clear active colors
  DOM.noteColorOptions.forEach(opt => opt.classList.remove('active'));
  
  if (note) {
    DOM.noteModalTitle.innerText = 'Edit Note';
    DOM.noteId.value = note.id;
    DOM.noteTitleInput.value = note.title;
    DOM.noteContentInput.value = note.content;
    DOM.noteTagsInput.value = note.tags ? note.tags.join(', ') : '';
    
    // Set active color pick option
    const activeColorOption = Array.from(DOM.noteColorOptions).find(opt => opt.getAttribute('data-color') === note.color);
    if (activeColorOption) activeColorOption.classList.add('active');
    
    // Toggle pin layout status text on delete button
    DOM.noteModalPin.innerHTML = note.pinned 
      ? '<i class="fa-solid fa-thumbtack" style="color:var(--accent-color);"></i> Unpin Note' 
      : '<i class="fa-solid fa-thumbtack"></i> Pin Note';
      
    DOM.noteModalDelete.style.display = 'block';
  } else {
    DOM.noteModalTitle.innerText = 'Create Note';
    DOM.noteId.value = '';
    DOM.noteColorOptions[0].classList.add('active'); // Default theme pick option
    DOM.noteModalPin.innerHTML = '<i class="fa-solid fa-thumbtack"></i> Pin Note';
    DOM.noteModalDelete.style.display = 'none';
  }
  
  DOM.noteModal.classList.add('active');
}

function closeNoteModal() {
  DOM.noteModal.classList.remove('active');
  // Clear any active autosave triggers
  if (state.autosaveTimeout) clearTimeout(state.autosaveTimeout);
}

/**
 * Handles notes auto-save database insertion dynamically on typing
 */
function handleNoteInput() {
  DOM.noteSaveStatus.innerText = 'Saving...';
  
  if (state.autosaveTimeout) {
    clearTimeout(state.autosaveTimeout);
  }
  
  state.autosaveTimeout = setTimeout(async () => {
    const noteId = DOM.noteId.value;
    const title = DOM.noteTitleInput.value.trim();
    const content = DOM.noteContentInput.value.trim();
    
    // Do not auto-save empty notes that aren't created yet
    if (!noteId && !title && !content) {
      DOM.noteSaveStatus.innerText = 'Saved';
      return;
    }
    
    // Parse note elements
    const tags = DOM.noteTagsInput.value.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const activeColorOpt = document.querySelector('.note-color-option.active');
    const color = activeColorOpt ? activeColorOpt.getAttribute('data-color') : 'default';
    
    const noteData = {
      title: title || 'Untitled Note',
      content,
      tags,
      color,
      updatedAt: Date.now()
    };
    
    if (noteId) {
      // Edit mode: fetch original node's pin status
      const existing = state.notes.find(n => n.id === Number(noteId));
      noteData.id = Number(noteId);
      noteData.pinned = existing ? existing.pinned : false;
      
      await db.update('notes', noteData);
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.pushToCloud('notes', noteData);
      }
    } else {
      // New note creation
      noteData.pinned = false;
      const newId = await db.add('notes', noteData);
      DOM.noteId.value = newId;
      noteData.id = newId;
      DOM.noteModalTitle.innerText = 'Edit Note';
      DOM.noteModalDelete.style.display = 'block';
      await logHistory('created', 'notes', noteData.title);
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.pushToCloud('notes', noteData);
      }
    }
    
    await reloadData();
    renderAll();
    DOM.noteSaveStatus.innerText = 'Saved';
  }, 800); // 800ms debounce save
}

/* ==========================================================================
   EVENT LISTENERS BINDING
   ========================================================================== */
function setupEventListeners() {
  
  // 1. Sidebar Nav Views toggles
  DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });
  
  // 2. Action buttons linking to views (e.g. from Dashboard widgets)
  DOM.actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-go-to-view');
      switchView(targetView);
    });
  });
  
  // 3. Theme selector clicks
  DOM.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-set-theme');
      setTheme(theme);
      showToast(`Switched theme to ${theme.toUpperCase()}`);
    });
  });
  
  // 4. Global Search query tracking
  DOM.globalSearch.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderAll(); // Refresh active panels with filters
  });
  
  // 5. Timetable interactions
  DOM.btnAddEvent.addEventListener('click', () => openEventModal());
  DOM.eventModalClose.addEventListener('click', closeEventModal);
  DOM.eventModalCancel.addEventListener('click', closeEventModal);
  
  DOM.eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = DOM.eventId.value;
    const title = DOM.eventTitleInput.value.trim();
    const day = DOM.eventDayInput.value;
    const category = DOM.eventCategoryInput.value;
    const startTime = DOM.eventStartInput.value;
    const endTime = DOM.eventEndInput.value;
    const location = DOM.eventLocationInput.value.trim();
    
    // Time validation check
    if (startTime >= endTime) {
      showToast('End time must be after the start time.', 'error');
      return;
    }
    
    const eventData = {
      title,
      day,
      category,
      startTime,
      endTime,
      location
    };
    
    if (id) {
      eventData.id = Number(id);
    }
    
    // Conflict schedule validation
    const conflictingEvent = hasOverlapConflict(eventData);
    if (conflictingEvent) {
      const confirmForce = confirm(
        `Time Conflict! This slot overlaps with "${conflictingEvent.title}" (${conflictingEvent.startTime} - ${conflictingEvent.endTime}). Do you want to schedule it anyway?`
      );
      if (!confirmForce) return;
    }
    
    try {
      if (id) {
        await db.update('timetable', eventData);
        if (window.firebaseSync && window.firebaseSync.currentUser) {
          await window.firebaseSync.pushToCloud('timetable', eventData);
        }
        showToast('Event updated successfully');
        await logHistory('updated', 'timetable', title);
      } else {
        const newId = await db.add('timetable', eventData);
        eventData.id = newId;
        if (window.firebaseSync && window.firebaseSync.currentUser) {
          await window.firebaseSync.pushToCloud('timetable', eventData);
        }
        showToast('Event scheduled successfully');
        await logHistory('scheduled', 'timetable', title);
      }
      
      await reloadData();
      closeEventModal();
      renderAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to save event schedule.', 'error');
    }
  });
  
  // 6. To-Do Interactions
  DOM.todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = DOM.todoTitle.value.trim();
    const priority = DOM.todoPriority.value;
    const dueDate = DOM.todoDue.value;
    const category = DOM.todoCategory.value;
    
    if (!title) return;
    
    const taskData = {
      title,
      priority,
      dueDate: dueDate || null,
      category,
      completed: false
    };
    
    try {
      const newId = await db.add('todos', taskData);
      taskData.id = newId;
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.pushToCloud('todos', taskData);
      }
      DOM.todoForm.reset();
      await logHistory('added', 'todo', title);
      await reloadData();
      renderAll();
      showToast('New task added!');
    } catch (err) {
      console.error(err);
      showToast('Failed to create task.', 'error');
    }
  });
  
  // Task filter tabs clicks
  DOM.todoTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.todoTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.todoFilter = btn.getAttribute('data-todo-tab');
      renderTodos();
    });
  });
  
  // 7. Notes interactions & autosave triggers
  DOM.btnAddNote.addEventListener('click', () => openNoteModal());
  DOM.noteModalClose.addEventListener('click', closeNoteModal);
  
  // Color Picker Option changes
  DOM.noteColorOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      DOM.noteColorOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      handleNoteInput(); // Trigger autosave state for style color update
    });
  });
  
  // Inputs monitoring for autosave trigger
  DOM.noteTitleInput.addEventListener('input', handleNoteInput);
  DOM.noteContentInput.addEventListener('input', handleNoteInput);
  DOM.noteTagsInput.addEventListener('input', handleNoteInput);
  
  // Pin Note inside modal
  DOM.noteModalPin.addEventListener('click', async () => {
    const noteId = DOM.noteId.value;
    if (!noteId) {
      showToast('Write something in the note first to pin it.', 'error');
      return;
    }
    
    const note = state.notes.find(n => n.id === Number(noteId));
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
      await db.update('notes', note);
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.pushToCloud('notes', note);
      }
      await logHistory(note.pinned ? 'pinned' : 'unpinned', 'notes', note.title);
      await reloadData();
      renderAll();
      
      DOM.noteModalPin.innerHTML = note.pinned 
        ? '<i class="fa-solid fa-thumbtack" style="color:var(--accent-color);"></i> Unpin Note' 
        : '<i class="fa-solid fa-thumbtack"></i> Pin Note';
        
      showToast(note.pinned ? 'Note pinned' : 'Note unpinned');
    }
  });
  
  DOM.noteModalDelete.addEventListener('click', async () => {
    const noteId = DOM.noteId.value;
    if (noteId && confirm('Permanently delete this note?')) {
      const note = state.notes.find(n => n.id === Number(noteId));
      await db.delete('notes', Number(noteId));
      if (window.firebaseSync && window.firebaseSync.currentUser) {
        await window.firebaseSync.deleteFromCloud('notes', Number(noteId));
      }
      await logHistory('deleted', 'notes', note ? note.title : 'Untitled Note');
      await reloadData();
      closeNoteModal();
      renderAll();
      showToast('Note deleted');
    }
  });
  
  // Save/Done button in Note form
  DOM.noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    closeNoteModal();
  });
  
  // 8. Database Actions (Export / Import backups)
  DOM.btnExport.addEventListener('click', async () => {
    try {
      const data = await db.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Database exported successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export data.', 'error');
    }
  });
  
  DOM.btnImportTrigger.addEventListener('click', () => {
    DOM.dbFileInput.click();
  });
  
  DOM.dbFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        
        // Confirm backup restore
        const confirmRestore = confirm('Restore backup? This action will overwrite all current schedule, tasks, and notes.');
        if (!confirmRestore) return;
        
        await db.importData(data);
        if (window.firebaseSync && window.firebaseSync.currentUser) {
          await syncLocalToCloud();
        }
        await logHistory('imported', 'system', file.name);
        await reloadData();
        renderAll();
        showToast('Backup restored successfully!');
      } catch (err) {
        console.error(err);
        showToast('Invalid backup file. Could not import.', 'error');
      }
    };
    reader.readAsText(file);
    // Clear value to allow re-uploading same file name
    DOM.dbFileInput.value = '';
  });

  // 9. Clear History logs
  if (DOM.btnClearHistory) {
    DOM.btnClearHistory.addEventListener('click', async () => {
      if (confirm('Clear all recent activity logs?')) {
        try {
          await db.clearStore('history');
          if (window.firebaseSync && window.firebaseSync.currentUser) {
            await window.firebaseSync.clearCloudStore('history');
          }
          await reloadData();
          renderHistory();
          showToast('Activity logs cleared');
        } catch (err) {
          console.error(err);
          showToast('Failed to clear history log.', 'error');
        }
      }
    });
  }

  // 10. Firebase Cloud Sync Modal Listeners
  if (DOM.btnCloudSettings) {
    DOM.btnCloudSettings.addEventListener('click', () => {
      DOM.cloudModal.classList.add('active');
    });
  }
  
  if (DOM.cloudModalClose) {
    DOM.cloudModalClose.addEventListener('click', () => {
      DOM.cloudModal.classList.remove('active');
    });
  }
  
  if (DOM.cloudModal) {
    DOM.cloudModal.addEventListener('click', (e) => {
      if (e.target === DOM.cloudModal) {
        DOM.cloudModal.classList.remove('active');
      }
    });
  }
  
  if (DOM.tabCloudConfig) {
    DOM.tabCloudConfig.addEventListener('click', () => {
      DOM.tabCloudConfig.classList.add('active');
      DOM.tabCloudAuth.classList.remove('active');
      DOM.panelCloudConfig.style.display = 'block';
      DOM.panelCloudAuth.style.display = 'none';
    });
  }
  
  if (DOM.tabCloudAuth) {
    DOM.tabCloudAuth.addEventListener('click', () => {
      DOM.tabCloudConfig.classList.remove('active');
      DOM.tabCloudAuth.classList.add('active');
      DOM.panelCloudConfig.style.display = 'none';
      DOM.panelCloudAuth.style.display = 'block';
    });
  }
  
  if (DOM.btnCloudSave) {
    DOM.btnCloudSave.addEventListener('click', () => {
      const apiKey = DOM.cloudApiKey.value.trim();
      const projectId = DOM.cloudProjectId.value.trim();
      const authDomain = DOM.cloudAuthDomain.value.trim();
      const messagingSenderId = DOM.cloudMessagingId.value.trim();
      const appId = DOM.cloudAppId.value.trim();
      
      if (!apiKey || !projectId || !authDomain || !messagingSenderId || !appId) {
        showToast('Please fill out all configuration fields.', 'error');
        return;
      }
      
      const config = { apiKey, projectId, authDomain, messagingSenderId, appId };
      localStorage.setItem('zenflow-firebase-config', JSON.stringify(config));
      showToast('Firebase configuration saved!');
      
      setTimeout(() => {
        location.reload();
      }, 1000);
    });
  }
  
  if (DOM.btnCloudClear) {
    DOM.btnCloudClear.addEventListener('click', () => {
      if (confirm('Disconnect from Firebase cloud database? Local data will not be deleted.')) {
        localStorage.removeItem('zenflow-firebase-config');
        showToast('Disconnected from cloud sync.');
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }
  
  if (DOM.cloudLoginForm) {
    DOM.cloudLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = DOM.cloudEmail.value.trim();
      const password = DOM.cloudPassword.value;
      
      if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
      }
      
      try {
        updateCloudStatus('syncing');
        await window.firebaseSync.signIn(email, password);
        showToast('Signed in successfully!');
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            showToast('Authenticating/Registering account...', 'info');
            await window.firebaseSync.signUp(email, password);
            showToast('Account auto-created and signed in!');
          } catch (signUpErr) {
            console.error(signUpErr);
            if (signUpErr.code === 'auth/email-already-in-use') {
              updateCloudStatus('error');
              showToast(err.message, 'error');
            } else {
              updateCloudStatus('error');
              showToast(signUpErr.message, 'error');
            }
          }
        } else {
          updateCloudStatus('error');
          showToast(err.message, 'error');
        }
      }
    });
  }
  
  if (DOM.btnCloudRegister) {
    DOM.btnCloudRegister.addEventListener('click', async () => {
      const email = DOM.cloudEmail.value.trim();
      const password = DOM.cloudPassword.value;
      
      if (!email || !password) {
        showToast('Please enter email and password for registration.', 'error');
        return;
      }
      
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      
      try {
        updateCloudStatus('syncing');
        await window.firebaseSync.signUp(email, password);
        showToast('Account created successfully!');
      } catch (err) {
        console.error(err);
        updateCloudStatus('error');
        showToast(err.message, 'error');
      }
    });
  }
  
  if (DOM.btnCloudLogout) {
    DOM.btnCloudLogout.addEventListener('click', async () => {
      if (confirm('Sign out of your cloud workspace? Local data will persist.')) {
        try {
          await window.firebaseSync.signOut();
          showToast('Signed out of cloud workspace.');
        } catch (err) {
          console.error(err);
          showToast('Sign out failed.', 'error');
        }
      }
    });
  }

  // Google Sign-In button
  const btnCloudGoogle = document.getElementById('btn-cloud-google');
  if (btnCloudGoogle) {
    btnCloudGoogle.addEventListener('click', async () => {
      try {
        updateCloudStatus('syncing');
        await window.firebaseSync.signInWithGoogle();
        showToast('Signed in with Google!');
      } catch (err) {
        console.error(err);
        if (err.code !== 'auth/popup-closed-by-user') {
          updateCloudStatus('error');
          showToast(err.message, 'error');
        } else {
          updateCloudStatus('local-auth-required');
        }
      }
    });
  }
}

/* ==========================================================================
   UTILITY HELPER FUNCTIONS
   ========================================================================== */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ==========================================================================
   14. FIREBASE CLOUD SYNC SERVICES
   ========================================================================== */
async function syncAllFromCloud() {
  if (!window.firebaseSync || !window.firebaseSync.currentUser) return;
  
  const stores = ['timetable', 'todos', 'notes', 'history'];
  let anyPulled = false;
  
  updateCloudStatus('syncing');
  try {
    for (const store of stores) {
      const cloudItems = await window.firebaseSync.pullFromCloud(store);
      
      if (cloudItems.length > 0) {
        await db.clearStore(store);
        for (const item of cloudItems) {
          if (item.id !== undefined) {
            item.id = Number(item.id);
          }
          await db.add(store, item);
        }
        anyPulled = true;
      } else {
        // Cloud is empty, push local state to cloud
        for (const item of state[store]) {
          await window.firebaseSync.pushToCloud(store, item);
        }
      }
    }
    
    if (anyPulled) {
      showToast('Synchronized workspace from cloud!');
    } else {
      showToast('Workspace backed up to cloud!');
    }
    
    await reloadData();
    renderAll();
    updateCloudStatus('connected');
  } catch (err) {
    console.error('Failed to sync from cloud:', err);
    updateCloudStatus('error');
    showToast('Failed to sync data from cloud.', 'error');
  }
}

async function syncLocalToCloud() {
  if (!window.firebaseSync || !window.firebaseSync.currentUser) return;
  
  updateCloudStatus('syncing');
  try {
    await reloadData();
    const stores = ['timetable', 'todos', 'notes', 'history'];
    for (const store of stores) {
      await window.firebaseSync.clearCloudStore(store);
      for (const item of state[store]) {
        await window.firebaseSync.pushToCloud(store, item);
      }
    }
    updateCloudStatus('connected');
  } catch (err) {
    console.error('Failed to sync local to cloud:', err);
    updateCloudStatus('error');
  }
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3-84toSLUqyFJcTtbjwZL5tsLaC2FnrQ",
  authDomain: "zenflow-c8c2e.firebaseapp.com",
  projectId: "zenflow-c8c2e",
  storageBucket: "zenflow-c8c2e.firebasestorage.app",
  messagingSenderId: "601230152272",
  appId: "1:601230152272:web:8a8d480dca9f3ca24b7755",
  measurementId: "G-HLWYEMCZMV"
};

function initFirebaseSync() {
  let config = null;
  const savedConfig = localStorage.getItem('zenflow-firebase-config');
  
  if (savedConfig) {
    try {
      config = JSON.parse(savedConfig);
    } catch (e) {
      console.error('Failed to parse Firebase config:', e);
    }
  }
  
  // Fallback to pre-configured Firebase database out-of-the-box
  if (!config) {
    config = DEFAULT_FIREBASE_CONFIG;
  }

  if (config && config.apiKey) {
    // Populate configuration fields in the modal
    DOM.cloudApiKey.value = config.apiKey || '';
    DOM.cloudProjectId.value = config.projectId || '';
    DOM.cloudAuthDomain.value = config.authDomain || '';
    DOM.cloudMessagingId.value = config.messagingSenderId || '';
    DOM.cloudAppId.value = config.appId || '';
    
    const success = window.firebaseSync.init(config);
    if (success) {
      window.firebaseSync.onAuthStateChanged(handleAuthStateChanged);
      updateCloudStatus('local-auth-required');
    } else {
      updateCloudStatus('error');
    }
  } else {
    updateCloudStatus('disconnected');
  }
}

function handleAuthStateChanged(user) {
  const sidebarSignedIn  = document.getElementById('sidebar-user-signed-in');
  const sidebarSignedOut = document.getElementById('sidebar-user-signed-out');
  const sidebarAvatar    = document.getElementById('sidebar-user-avatar');
  const sidebarName      = document.getElementById('sidebar-user-name');
  const sidebarEmailDisp = document.getElementById('sidebar-user-email-display');

  if (user) {
    // Update cloud modal state
    if (DOM.cloudAuthSignedOut) DOM.cloudAuthSignedOut.style.display = 'none';
    if (DOM.cloudAuthSignedIn)  DOM.cloudAuthSignedIn.style.display  = 'block';
    if (DOM.cloudUserEmail)     DOM.cloudUserEmail.innerText = user.email || user.displayName || '';

    // Update sidebar account widget
    if (sidebarSignedIn)  sidebarSignedIn.style.display  = 'block';
    if (sidebarSignedOut) sidebarSignedOut.style.display = 'none';
    const displayName = user.displayName || user.email || 'User';
    const initial = displayName.charAt(0).toUpperCase();
    if (sidebarAvatar)    sidebarAvatar.textContent    = initial;
    if (sidebarName)      sidebarName.textContent      = displayName;
    if (sidebarEmailDisp) sidebarEmailDisp.textContent = user.email || '';

    updateCloudStatus('connected');

    // Dismiss splash and enter the main app
    enterApp();
    setSplashLoading(false);
    showToast(`Welcome, ${user.displayName || user.email}! 🎉`);

    syncAllFromCloud().catch(err => {
      console.error('Sync failed:', err);
    });
  } else {
    // Update cloud modal state
    if (DOM.cloudAuthSignedOut) DOM.cloudAuthSignedOut.style.display = 'block';
    if (DOM.cloudAuthSignedIn)  DOM.cloudAuthSignedIn.style.display  = 'none';
    if (DOM.cloudUserEmail)     DOM.cloudUserEmail.innerText = '';

    // Update sidebar account widget
    if (sidebarSignedIn)  sidebarSignedIn.style.display  = 'none';
    if (sidebarSignedOut) sidebarSignedOut.style.display = 'block';

    updateCloudStatus('local-auth-required');
  }
}

function updateCloudStatus(status) {
  if (!DOM.cloudStatusDot || !DOM.cloudStatusText) return;
  DOM.cloudStatusDot.className = 'db-status-dot';
  
  switch (status) {
    case 'connected':
      DOM.cloudStatusDot.classList.add('connected');
      DOM.cloudStatusText.innerText = 'Cloud Synced';
      break;
    case 'local-auth-required':
      DOM.cloudStatusDot.classList.add('syncing');
      DOM.cloudStatusText.innerText = 'Login Required';
      break;
    case 'syncing':
      DOM.cloudStatusDot.classList.add('syncing');
      DOM.cloudStatusText.innerText = 'Syncing...';
      break;
    case 'error':
      DOM.cloudStatusDot.classList.add('error');
      DOM.cloudStatusText.innerText = 'Cloud Error';
      break;
    case 'disconnected':
    default:
      DOM.cloudStatusDot.classList.add('local');
      DOM.cloudStatusText.innerText = 'Local Mode';
      break;
  }
}


/* ==========================================================================
   13. HISTORY TRACKER & AUDIT LOGGER SERVICES
   ========================================================================== */
/**
 * Write a new activity log entry to history store
 */
async function logHistory(action, category, details) {
  try {
    const entry = {
      action, // e.g. 'scheduled', 'completed', 'deleted', 'created'
      category, // e.g. 'timetable', 'todo', 'notes', 'system'
      details, // e.g. 'Math Lecture class' or 'Write Physics report task'
      timestamp: Date.now()
    };
    const newId = await db.add('history', entry);
    entry.id = newId;
    state.history = await db.getAll('history');
    renderHistory();
    if (window.firebaseSync && window.firebaseSync.currentUser) {
      await window.firebaseSync.pushToCloud('history', entry);
    }
  } catch (err) {
    console.error('Failed to log history:', err);
  }
}

/**
 * Render history log list
 */
function renderHistory() {
  if (!DOM.dashboardHistory) return;
  
  DOM.dashboardHistory.innerHTML = '';
  
  // Sort history descending by timestamp
  const logs = [...state.history];
  logs.sort((a, b) => b.timestamp - a.timestamp);
  
  if (logs.length === 0) {
    DOM.dashboardHistory.innerHTML = `
      <div class="history-empty">
        <i class="fa-regular fa-clock" style="font-size: 1.5rem; opacity: 0.5;"></i>
        <span>No recent activities logged.</span>
      </div>
    `;
    return;
  }
  
  // Show top 5 history entries
  logs.slice(0, 5).forEach(log => {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    let iconClass = 'fa-solid fa-clock';
    if (log.category === 'timetable') iconClass = 'fa-solid fa-calendar-days';
    else if (log.category === 'todo') iconClass = 'fa-solid fa-list-check';
    else if (log.category === 'notes') iconClass = 'fa-solid fa-note-sticky';
    else if (log.category === 'system') iconClass = 'fa-solid fa-database';
    
    const timeAgoStr = formatRelativeTime(log.timestamp);
    const textHTML = getHistoryTextHTML(log);
    
    item.innerHTML = `
      <div class="history-icon-wrapper">
        <i class="${iconClass}"></i>
      </div>
      <div class="history-content">
        <span class="history-text">${textHTML}</span>
        <span class="history-time">${timeAgoStr}</span>
      </div>
    `;
    
    DOM.dashboardHistory.appendChild(item);
  });
}

function getHistoryTextHTML(log) {
  const detailsEsc = escapeHTML(log.details);
  
  if (log.category === 'timetable') {
    if (log.action === 'scheduled') return `Scheduled event <strong>${detailsEsc}</strong>`;
    if (log.action === 'updated') return `Updated event <strong>${detailsEsc}</strong>`;
    if (log.action === 'deleted') return `Deleted event <strong>${detailsEsc}</strong>`;
  }
  
  if (log.category === 'todo') {
    if (log.action === 'added') return `Added task <strong>${detailsEsc}</strong>`;
    if (log.action === 'completed') return `Completed task <strong>${detailsEsc}</strong>`;
    if (log.action === 'toggled_incomplete') return `Marked task <strong>${detailsEsc}</strong> as pending`;
    if (log.action === 'deleted') return `Deleted task <strong>${detailsEsc}</strong>`;
  }
  
  if (log.category === 'notes') {
    if (log.action === 'created') return `Created note <strong>${detailsEsc}</strong>`;
    if (log.action === 'autosaved') return `Autosaved note <strong>${detailsEsc}</strong>`;
    if (log.action === 'pinned') return `Pinned note <strong>${detailsEsc}</strong>`;
    if (log.action === 'unpinned') return `Unpinned note <strong>${detailsEsc}</strong>`;
    if (log.action === 'deleted') return `Deleted note <strong>${detailsEsc}</strong>`;
  }
  
  if (log.category === 'system') {
    if (log.action === 'imported') return `Restored database backup <strong>${detailsEsc}</strong>`;
  }
  
  return `${escapeHTML(log.action)} <strong>${detailsEsc}</strong>`;
}

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
