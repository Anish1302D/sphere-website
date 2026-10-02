/**
 * ================================================================
 * SPHERE COMMUNITY — MISSION CONTROL ADMIN LOGIC
 * Firestore CRUD: Events, Projects, Team Members, Home Telemetry
 * Real-time updates, image compression, search filters, and editing
 * ================================================================
 */

import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const authStatusPill = document.getElementById('auth-status-pill');
const adminUserDisplay = document.getElementById('admin-user-display');
const quickMetricsBar = document.getElementById('quick-metrics-bar');

const metricEvents = document.getElementById('metric-events-count');
const metricGallery = document.getElementById('metric-gallery-count');
const metricProjects = document.getElementById('metric-projects-count');
const metricTeam = document.getElementById('metric-team-count');

// Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `px-4 py-3 rounded-2xl shadow-lg border text-xs font-title-caps font-semibold flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto ${
        isError ? 'bg-error text-white border-error/50' : 'bg-surface-container-lowest text-on-surface border-secondary/40 shadow-[0_4px_20px_rgba(17,90,254,0.15)]'
    }`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-[18px] ${isError ? 'text-white' : 'text-secondary'}">
            ${isError ? 'error' : 'check_circle'}
        </span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Delete Confirmation Modal Logic
let pendingDeleteAction = null;
const deleteModal = document.getElementById('delete-modal');
const deleteModalCancel = document.getElementById('delete-modal-cancel');
const deleteModalConfirm = document.getElementById('delete-modal-confirm');

function confirmDelete(message, onConfirm) {
    pendingDeleteAction = onConfirm;
    if (deleteModal) {
        deleteModal.classList.remove('opacity-0', 'pointer-events-none');
        deleteModal.querySelector('div').classList.remove('scale-95');
    }
}

function closeDeleteModal() {
    pendingDeleteAction = null;
    if (deleteModal) {
        deleteModal.classList.add('opacity-0', 'pointer-events-none');
        deleteModal.querySelector('div').classList.add('scale-95');
    }
}

if (deleteModalCancel) deleteModalCancel.addEventListener('click', closeDeleteModal);
if (deleteModalConfirm) {
    deleteModalConfirm.addEventListener('click', async () => {
        if (typeof pendingDeleteAction === 'function') {
            await pendingDeleteAction();
        }
        closeDeleteModal();
    });
}

// Image Compression Helper
function compressImage(file, maxWidth = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataURL = canvas.toDataURL('image/jpeg', quality);
                resolve(dataURL);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function getImageValue(fileInputId, textInputId) {
    const fileInput = document.getElementById(fileInputId);
    const textInput = document.getElementById(textInputId);

    if (fileInput && fileInput.files && fileInput.files[0]) {
        return await compressImage(fileInput.files[0], 600, 0.8);
    }
    if (textInput && textInput.value.trim()) {
        return textInput.value.trim();
    }
    return '';
}

function setupImagePreview(fileInputId, previewContainerId, previewImgId) {
    const fileInput = document.getElementById(fileInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImg = document.getElementById(previewImgId);

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    previewImg.src = ev.target.result;
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.classList.add('hidden');
            }
        });
    }
}

setupImagePreview('ev-image-file', 'ev-image-preview', 'ev-preview-img');
setupImagePreview('proj-image-file', 'proj-image-preview', 'proj-preview-img');
setupImagePreview('tm-image-file', 'tm-image-preview', 'tm-preview-img');
setupImagePreview('gal-image-file', 'gal-image-preview', 'gal-preview-img');

const galClearPreviewBtn = document.getElementById('gal-clear-preview-btn');
if (galClearPreviewBtn) {
    galClearPreviewBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('gal-image-file');
        const urlInput = document.getElementById('gal-image');
        const preview = document.getElementById('gal-image-preview');
        const previewImg = document.getElementById('gal-preview-img');
        if (fileInput) fileInput.value = '';
        if (urlInput) urlInput.value = '';
        if (previewImg) previewImg.src = '';
        if (preview) preview.classList.add('hidden');
    });
}

const galToggleCustomEvent = document.getElementById('gal-toggle-custom-event');
const galEventCustom = document.getElementById('gal-event-custom');
if (galToggleCustomEvent) {
    galToggleCustomEvent.addEventListener('click', () => {
        if (galEventCustom) {
            const isHidden = galEventCustom.classList.contains('hidden');
            if (isHidden) {
                galEventCustom.classList.remove('hidden');
                galEventCustom.focus();
                galToggleCustomEvent.textContent = '← Choose from List';
            } else {
                galEventCustom.classList.add('hidden');
                galEventCustom.value = '';
                galToggleCustomEvent.textContent = '+ Custom Event Name';
            }
        }
    });
}

// --- TABS LOGIC ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
            b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
        btn.classList.remove('text-on-surface-variant');

        const targetId = btn.getAttribute('data-target');
        tabContents.forEach(tc => {
            if (tc.id === targetId) tc.classList.remove('hidden');
            else tc.classList.add('hidden');
        });

        if (targetId === 'tab-events') loadEvents();
        if (targetId === 'tab-gallery') loadGallery();
        if (targetId === 'tab-projects') loadProjects();
        if (targetId === 'tab-team') loadTeam();
        if (targetId === 'tab-showcase') loadHomepageShowcase();
        if (targetId === 'tab-home') loadHomeSettings();
    });
});

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        authStatusPill.classList.remove('hidden');
        authStatusPill.classList.add('flex');
        quickMetricsBar.classList.remove('hidden');
        quickMetricsBar.classList.add('flex');
        adminUserDisplay.textContent = user.email || 'Admin';

        loadEvents();
        loadGallery();
        loadProjects();
        loadTeam();
        loadHomepageShowcase();
        loadHomeSettings();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        authStatusPill.classList.add('hidden');
        authStatusPill.classList.remove('flex');
        quickMetricsBar.classList.add('hidden');
        quickMetricsBar.classList.remove('flex');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Verifying...</span>';
    submitBtn.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginError.classList.add('hidden');
        showToast("Signed in successfully as " + email);
    } catch (error) {
        console.error('[Admin] Sign in error:', error);
        loginError.textContent = "Authentication failed: " + (error.message || error.code);
        loginError.classList.remove('hidden');
    } finally {
        submitBtn.innerHTML = '<span>SIGN IN TO DASHBOARD</span><span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
        submitBtn.disabled = false;
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        showToast("Signed out of Mission Control.");
    });
}

// ========================================================
// 1. EVENTS MANAGEMENT LOGIC
// ========================================================
const eventsCol = collection(db, 'events');
const addEventForm = document.getElementById('add-event-form');
const eventsList = document.getElementById('events-list');
const eventsSearch = document.getElementById('events-search');
let cachedEvents = [];

addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('ev-submit-btn');
    const editId = document.getElementById('ev-edit-id').value;
    const isEditing = !!editId;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>${isEditing ? 'Updating...' : 'Publishing...'}</span>`;

    try {
        const fileInput = document.getElementById('ev-image-file');
        const urlInput = document.getElementById('ev-image');
        const hasNewFile = fileInput && fileInput.files && fileInput.files[0];
        const hasNewUrl = urlInput && urlInput.value.trim();

        const eventData = {
            title: document.getElementById('ev-title').value.trim(),
            date: document.getElementById('ev-date').value.trim(),
            duration: document.getElementById('ev-duration').value.trim() || '36-Hour Sprint',
            location: document.getElementById('ev-location').value.trim() || 'Hybrid',
            category: document.getElementById('ev-category').value,
            status: document.getElementById('ev-status').value,
            link: document.getElementById('ev-link').value.trim(),
            description: document.getElementById('ev-desc').value.trim(),
            featuredOnHome: document.getElementById('ev-featured-home').checked
        };

        if (isEditing) {
            if (hasNewFile || hasNewUrl) {
                eventData.image = await getImageValue('ev-image-file', 'ev-image');
            }
            await updateDoc(doc(db, 'events', editId), eventData);
            showToast("Event updated successfully!");
        } else {
            eventData.image = await getImageValue('ev-image-file', 'ev-image');
            eventData.createdAt = serverTimestamp();
            await addDoc(eventsCol, eventData);
            showToast("New event published!");
        }

        cancelEventEdit();
        await loadEvents();
    } catch (error) {
        console.error("Error saving event:", error);
        showToast("Error saving event: " + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Save Event</span>';
    }
});

async function editEvent(docId) {
    try {
        const docSnap = await getDoc(doc(db, 'events', docId));
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        document.getElementById('ev-edit-id').value = docId;
        document.getElementById('ev-title').value = data.title || '';
        document.getElementById('ev-date').value = data.date || '';
        document.getElementById('ev-duration').value = data.duration || '';
        let cat = (data.category || 'hackathons').toLowerCase();
        if (cat === 'hackathon') cat = 'hackathons';
        if (cat === 'workshop') cat = 'workshops';
        if (cat === 'meetup') cat = 'meetups';
        if (cat === 'pitch') cat = 'demodays';
        document.getElementById('ev-category').value = cat;
        document.getElementById('ev-link').value = data.link || '';
        document.getElementById('ev-desc').value = data.description || '';
        document.getElementById('ev-featured-home').checked = data.featuredOnHome !== false;

        if (data.image) {
            document.getElementById('ev-preview-img').src = data.image;
            document.getElementById('ev-image-preview').classList.remove('hidden');
        }

        document.getElementById('event-form-title').textContent = "Edit Event";
        document.getElementById('ev-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">edit</span><span>Update Event</span>';
        document.getElementById('ev-cancel-edit-btn').classList.remove('hidden');

        document.getElementById('event-form-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        showToast("Error loading event: " + err.message, 'error');
    }
}

function cancelEventEdit() {
    document.getElementById('ev-edit-id').value = '';
    addEventForm.reset();
    document.getElementById('ev-image-preview').classList.add('hidden');
    document.getElementById('event-form-title').textContent = "Add New Event";
    document.getElementById('ev-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Save Event</span>';
    document.getElementById('ev-cancel-edit-btn').classList.add('hidden');
}

document.getElementById('ev-cancel-edit-btn').addEventListener('click', cancelEventEdit);

async function loadEvents() {
    eventsList.innerHTML = '<p class="text-on-surface-variant/60 text-center py-8">Fetching events...</p>';
    try {
        const q = query(eventsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        cachedEvents = [];
        snapshot.forEach(docSnap => {
            cachedEvents.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (metricEvents) metricEvents.textContent = cachedEvents.length;
        renderEventsList(cachedEvents);
        updateGalleryEventOptions(cachedEvents);
    } catch (e) {
        eventsList.innerHTML = '<p class="text-error text-center py-8">Error loading events: ' + e.message + '</p>';
    }
}

function renderEventsList(items) {
    if (!items.length) {
        eventsList.innerHTML = '<p class="text-on-surface-variant/50 text-center py-8">No events found.</p>';
        return;
    }

    eventsList.innerHTML = '';
    items.forEach(data => {
        const isDone = data.status === 'done';
        const card = document.createElement('div');
        card.className = 'group p-4 rounded-xl bg-surface-container-low border border-surface-container hover:border-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4';

        const thumbHtml = data.image 
            ? `<img src="${data.image}" alt="" class="w-12 h-12 rounded-lg object-cover border border-surface-container shrink-0"/>`
            : `<div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0"><span class="material-symbols-outlined text-[20px]">calendar_today</span></div>`;

        const homeBadge = data.featuredOnHome !== false 
            ? `<span class="px-2 py-0.5 rounded-full bg-secondary-container/15 text-secondary font-label-caps text-[9px] uppercase font-bold">HOME</span>` 
            : '';

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                ${thumbHtml}
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="font-headline-sm text-sm font-bold text-on-surface truncate">${data.title || 'Untitled Event'}</h4>
                        ${homeBadge}
                    </div>
                    <div class="flex items-center gap-3 text-xs text-on-surface-variant font-telemetry-code mt-0.5">
                        <span>${data.date || 'TBA'}</span>
                        <span>•</span>
                        <span>${data.location || 'Hybrid'}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button class="toggle-event-status px-2.5 py-1 rounded-full text-xs font-label-caps uppercase font-bold transition-all ${
                    isDone ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest' : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                }" data-id="${data.id}" data-current="${data.status}">
                    ${isDone ? 'COMPLETED' : 'UPCOMING'}
                </button>
                <button class="edit-event-btn p-2 rounded-lg bg-surface-container hover:bg-secondary/15 hover:text-secondary text-on-surface-variant transition-colors" data-id="${data.id}" title="Edit Event">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button class="delete-event-btn p-2 rounded-lg bg-surface-container hover:bg-error/15 hover:text-error text-on-surface-variant transition-colors" data-id="${data.id}" title="Delete Event">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        `;
        eventsList.appendChild(card);
    });

    // Attach listeners
    eventsList.querySelectorAll('.toggle-event-status').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const current = e.currentTarget.getAttribute('data-current');
            const newStatus = current === 'upcoming' ? 'done' : 'upcoming';
            e.currentTarget.disabled = true;
            await updateDoc(doc(db, 'events', id), { status: newStatus });
            showToast("Event status updated.");
            loadEvents();
        };
    });

    eventsList.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.onclick = (e) => editEvent(e.currentTarget.getAttribute('data-id'));
    });

    eventsList.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete("Delete this event?", async () => {
                await deleteDoc(doc(db, 'events', id));
                showToast("Event deleted.");
                loadEvents();
            });
        };
    });
}

if (eventsSearch) {
    eventsSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = cachedEvents.filter(ev => 
            (ev.title && ev.title.toLowerCase().includes(val)) ||
            (ev.location && ev.location.toLowerCase().includes(val))
        );
        renderEventsList(filtered);
    });
}

// ========================================================
// 1.5. EVENT GALLERY MANAGEMENT LOGIC
// ========================================================
const galleryCol = collection(db, 'gallery');
const addGalleryForm = document.getElementById('add-gallery-form');
const galleryAdminList = document.getElementById('gallery-admin-list');
const galleryAdminSearch = document.getElementById('gallery-admin-search');
let cachedGallery = [];

function updateGalleryEventOptions(events) {
    const select = document.getElementById('gal-event-select');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose from Published Events --</option>';
    events.forEach(ev => {
        if (ev.title) {
            const opt = document.createElement('option');
            opt.value = ev.title;
            opt.textContent = ev.title;
            opt.setAttribute('data-date', ev.date || '');
            opt.setAttribute('data-cat', ev.category || '');
            select.appendChild(opt);
        }
    });
    if (currentVal) select.value = currentVal;
}

if (galEventSelect) {
    galEventSelect.addEventListener('change', (e) => {
        const selectedOpt = e.target.selectedOptions[0];
        if (selectedOpt && selectedOpt.value) {
            const dateInput = document.getElementById('gal-date');
            const catSelect = document.getElementById('gal-category');
            if (dateInput && !dateInput.value && selectedOpt.getAttribute('data-date')) {
                dateInput.value = selectedOpt.getAttribute('data-date');
            }
            if (catSelect && selectedOpt.getAttribute('data-cat')) {
                let cat = selectedOpt.getAttribute('data-cat').toLowerCase();
                if (cat.startsWith('hack')) cat = 'hackathons';
                else if (cat.startsWith('work')) cat = 'workshops';
                else if (cat.startsWith('demo') || cat.startsWith('pitch')) cat = 'demodays';
                else if (cat.startsWith('hard') || cat.startsWith('lab')) cat = 'hardware';
                else if (cat.startsWith('comm') || cat.startsWith('meet')) cat = 'community';
                catSelect.value = cat;
            }
        }
    });
}

if (addGalleryForm) {
    addGalleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('gal-submit-btn');
        const editId = document.getElementById('gal-edit-id').value;
        const isEditing = !!editId;

        const fileInput = document.getElementById('gal-image-file');
        const urlInput = document.getElementById('gal-image');
        const hasNewFile = fileInput && fileInput.files && fileInput.files[0];
        const hasNewUrl = urlInput && urlInput.value.trim();

        // Determine event name: custom or select
        const customEventVal = (document.getElementById('gal-event-custom').value || '').trim();
        const selectEventVal = (document.getElementById('gal-event-select').value || '').trim();
        const eventName = customEventVal || selectEventVal || 'Sphere Event';

        const title = (document.getElementById('gal-title').value || '').trim();
        if (!title) {
            showToast("Please provide a photo caption or title.", 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>${isEditing ? 'Updating Photo...' : 'Uploading Photo...'}</span>`;

        try {
            let imageData = '';
            if (hasNewFile) {
                // Compress image for gallery with high fidelity (1200px max width, 0.85 quality)
                imageData = await compressImage(fileInput.files[0], 1200, 0.85);
            } else if (hasNewUrl) {
                imageData = urlInput.value.trim();
            }

            if (!isEditing && !imageData) {
                showToast("Please select an image file or enter an image URL.", 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_photo_alternate</span><span>Upload to Gallery</span>';
                return;
            }

            const photoData = {
                title: title,
                eventName: eventName,
                category: document.getElementById('gal-category').value,
                date: document.getElementById('gal-date').value.trim() || '2026',
                description: document.getElementById('gal-desc').value.trim(),
                isFeatured: document.getElementById('gal-featured').checked
            };

            if (imageData) {
                photoData.image = imageData;
            }

            if (isEditing) {
                await updateDoc(doc(db, 'gallery', editId), photoData);
                showToast("Gallery photograph updated successfully!");
            } else {
                photoData.createdAt = serverTimestamp();
                await addDoc(galleryCol, photoData);
                showToast("New photo published to Gallery!");
            }

            cancelGalleryEdit();
            await loadGallery();
        } catch (error) {
            console.error("Error saving gallery photo:", error);
            showToast("Error saving photo: " + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_photo_alternate</span><span>Upload to Gallery</span>';
        }
    });
}

async function editGalleryItem(docId) {
    try {
        const docSnap = await getDoc(doc(db, 'gallery', docId));
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        document.getElementById('gal-edit-id').value = docId;
        document.getElementById('gal-title').value = data.title || '';
        
        // Match event name
        const sel = document.getElementById('gal-event-select');
        let matched = false;
        if (sel) {
            for (let i = 0; i < sel.options.length; i++) {
                if (sel.options[i].value === data.eventName) {
                    sel.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
        }
        if (!matched && data.eventName) {
            document.getElementById('gal-event-custom').value = data.eventName;
            document.getElementById('gal-event-custom').classList.remove('hidden');
            if (galToggleCustomEvent) galToggleCustomEvent.textContent = '← Choose from List';
        }

        document.getElementById('gal-category').value = data.category || 'hackathons';
        document.getElementById('gal-date').value = data.date || '';
        document.getElementById('gal-desc').value = data.description || '';
        document.getElementById('gal-featured').checked = data.isFeatured !== false;

        if (data.image) {
            document.getElementById('gal-preview-img').src = data.image;
            document.getElementById('gal-image-preview').classList.remove('hidden');
        }

        document.getElementById('gallery-form-title').textContent = "Edit Photograph";
        document.getElementById('gal-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">edit</span><span>Update Photo</span>';
        document.getElementById('gal-cancel-edit-btn').classList.remove('hidden');

        document.getElementById('gallery-form-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        showToast("Error loading photo: " + err.message, 'error');
    }
}

function cancelGalleryEdit() {
    const editIdInput = document.getElementById('gal-edit-id');
    if (editIdInput) editIdInput.value = '';
    if (addGalleryForm) addGalleryForm.reset();
    const preview = document.getElementById('gal-image-preview');
    if (preview) preview.classList.add('hidden');
    const previewImg = document.getElementById('gal-preview-img');
    if (previewImg) previewImg.src = '';
    const customEventInput = document.getElementById('gal-event-custom');
    if (customEventInput) customEventInput.classList.add('hidden');
    if (galToggleCustomEvent) galToggleCustomEvent.textContent = '+ Custom Event Name';
    const titleEl = document.getElementById('gallery-form-title');
    if (titleEl) titleEl.textContent = "Add Photo to Gallery";
    const submitBtn = document.getElementById('gal-submit-btn');
    if (submitBtn) submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_photo_alternate</span><span>Upload to Gallery</span>';
    const cancelBtn = document.getElementById('gal-cancel-edit-btn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
}

const galCancelEditBtn = document.getElementById('gal-cancel-edit-btn');
if (galCancelEditBtn) galCancelEditBtn.addEventListener('click', cancelGalleryEdit);

async function loadGallery() {
    if (!galleryAdminList) return;
    galleryAdminList.innerHTML = '<p class="text-on-surface-variant/60 text-center col-span-full py-8">Fetching gallery photos...</p>';
    try {
        const q = query(galleryCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        cachedGallery = [];
        snapshot.forEach(docSnap => {
            cachedGallery.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (metricGallery) metricGallery.textContent = cachedGallery.length;
        renderGalleryAdminList(cachedGallery);
    } catch (e) {
        galleryAdminList.innerHTML = '<p class="text-error text-center col-span-full py-8">Error loading gallery: ' + e.message + '</p>';
    }
}

function renderGalleryAdminList(items) {
    if (!galleryAdminList) return;
    if (!items.length) {
        galleryAdminList.innerHTML = '<div class="col-span-full text-center py-12 text-on-surface-variant/50"><span class="material-symbols-outlined text-[36px] mb-2 opacity-50 block">photo_library</span><p>No gallery photos uploaded yet. Use the form on the left to add photos!</p></div>';
        return;
    }

    galleryAdminList.innerHTML = '';
    items.forEach(data => {
        const card = document.createElement('div');
        card.className = 'group p-3 rounded-2xl bg-surface-container-low border border-surface-container hover:border-secondary/30 transition-all flex flex-col justify-between gap-3';

        const thumbHtml = data.image 
            ? `<div class="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container shrink-0">
                 <img src="${data.image}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                 <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-label-caps text-[9px] uppercase font-bold tracking-wider">
                   ${data.category || 'EVENT'}
                 </div>
                 ${data.isFeatured ? '<div class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-label-caps text-[8px] font-bold">FEATURED</div>' : ''}
               </div>`
            : `<div class="w-full h-32 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0"><span class="material-symbols-outlined text-[32px]">photo_camera</span></div>`;

        card.innerHTML = `
            ${thumbHtml}
            <div class="flex-1 min-w-0">
                <h4 class="font-headline-sm text-sm font-bold text-on-surface line-clamp-1">${data.title || 'Untitled Photograph'}</h4>
                <div class="flex items-center gap-1.5 text-xs text-secondary font-telemetry-code mt-1 truncate">
                    <span class="material-symbols-outlined text-[13px]">event</span>
                    <span class="truncate">${data.eventName || 'Sphere Event'}</span>
                </div>
                <div class="text-[11px] text-on-surface-variant font-telemetry-code mt-0.5">
                    ${data.date || '2026'}
                </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
                <button class="edit-gal-btn p-2 rounded-lg bg-surface-container hover:bg-secondary/15 hover:text-secondary text-on-surface-variant transition-colors" data-id="${data.id}" title="Edit Photo">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button class="delete-gal-btn p-2 rounded-lg bg-surface-container hover:bg-error/15 hover:text-error text-on-surface-variant transition-colors" data-id="${data.id}" title="Delete Photo">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        `;
        galleryAdminList.appendChild(card);
    });

    // Attach listeners
    galleryAdminList.querySelectorAll('.edit-gal-btn').forEach(btn => {
        btn.onclick = (e) => editGalleryItem(e.currentTarget.getAttribute('data-id'));
    });

    galleryAdminList.querySelectorAll('.delete-gal-btn').forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete("Delete this photograph from the Gallery?", async () => {
                await deleteDoc(doc(db, 'gallery', id));
                showToast("Photograph removed from Gallery.");
                loadGallery();
            });
        };
    });
}

if (galleryAdminSearch) {
    galleryAdminSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = cachedGallery.filter(item => 
            (item.title && item.title.toLowerCase().includes(val)) ||
            (item.eventName && item.eventName.toLowerCase().includes(val)) ||
            (item.category && item.category.toLowerCase().includes(val))
        );
        renderGalleryAdminList(filtered);
    });
}

// ========================================================
// 2. PROJECTS MANAGEMENT LOGIC
// ========================================================
const projectsCol = collection(db, 'projects');
const addProjectForm = document.getElementById('add-project-form');
const projectsList = document.getElementById('projects-list');
const projectsSearch = document.getElementById('projects-search');
let cachedProjects = [];

addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('proj-submit-btn');
    const editId = document.getElementById('proj-edit-id').value;
    const isEditing = !!editId;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>${isEditing ? 'Updating...' : 'Publishing...'}</span>`;

    try {
        const fileInput = document.getElementById('proj-image-file');
        const urlInput = document.getElementById('proj-image');
        const hasNewFile = fileInput && fileInput.files && fileInput.files[0];
        const hasNewUrl = urlInput && urlInput.value.trim();

        const projectData = {
            title: document.getElementById('proj-title').value.trim(),
            category: document.getElementById('proj-category').value,
            status: document.getElementById('proj-status').value,
            techStack: document.getElementById('proj-tech').value.trim(),
            github: document.getElementById('proj-github').value.trim(),
            demo: document.getElementById('proj-demo').value.trim(),
            description: document.getElementById('proj-desc').value.trim(),
            isFlagship: document.getElementById('proj-is-flagship').checked,
            featuredOnHome: document.getElementById('proj-featured-home').checked
        };

        if (isEditing) {
            if (hasNewFile || hasNewUrl) {
                projectData.image = await getImageValue('proj-image-file', 'proj-image');
            }
            await updateDoc(doc(db, 'projects', editId), projectData);
            showToast("Project updated successfully!");
        } else {
            projectData.image = await getImageValue('proj-image-file', 'proj-image');
            projectData.createdAt = serverTimestamp();
            await addDoc(projectsCol, projectData);
            showToast("New project registered!");
        }

        cancelProjectEdit();
        await loadProjects();
    } catch (error) {
        console.error("Error saving project:", error);
        showToast("Error saving project: " + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Save Project</span>';
    }
});

async function editProject(docId) {
    try {
        const docSnap = await getDoc(doc(db, 'projects', docId));
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        document.getElementById('proj-edit-id').value = docId;
        document.getElementById('proj-title').value = data.title || '';
        let projCat = (data.category || 'distributed').toLowerCase();
        if (projCat === 'web') projCat = 'distributed';
        if (projCat === 'security') projCat = 'cybersecurity';
        if (projCat === 'uiux') projCat = 'spatial';
        document.getElementById('proj-category').value = projCat;
        document.getElementById('proj-status').value = data.status || 'ACTIVE';
        document.getElementById('proj-tech').value = data.techStack || '';
        document.getElementById('proj-github').value = data.github || '';
        document.getElementById('proj-demo').value = data.demo || '';
        document.getElementById('proj-desc').value = data.description || '';
        document.getElementById('proj-is-flagship').checked = !!data.isFlagship;
        document.getElementById('proj-featured-home').checked = data.featuredOnHome !== false;

        if (data.image) {
            document.getElementById('proj-preview-img').src = data.image;
            document.getElementById('proj-image-preview').classList.remove('hidden');
        }

        document.getElementById('project-form-title').textContent = "Edit Project";
        document.getElementById('proj-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">edit</span><span>Update Project</span>';
        document.getElementById('proj-cancel-edit-btn').classList.remove('hidden');

        document.getElementById('project-form-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        showToast("Error loading project: " + err.message, 'error');
    }
}

function cancelProjectEdit() {
    document.getElementById('proj-edit-id').value = '';
    addProjectForm.reset();
    document.getElementById('proj-image-preview').classList.add('hidden');
    document.getElementById('project-form-title').textContent = "Add New Project";
    document.getElementById('proj-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">add_circle</span><span>Save Project</span>';
    document.getElementById('proj-cancel-edit-btn').classList.add('hidden');
}

document.getElementById('proj-cancel-edit-btn').addEventListener('click', cancelProjectEdit);

async function loadProjects() {
    projectsList.innerHTML = '<p class="text-on-surface-variant/60 text-center py-8">Fetching projects...</p>';
    try {
        const q = query(projectsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        cachedProjects = [];
        snapshot.forEach(docSnap => {
            cachedProjects.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (metricProjects) metricProjects.textContent = cachedProjects.length;
        renderProjectsList(cachedProjects);
    } catch (e) {
        projectsList.innerHTML = '<p class="text-error text-center py-8">Error loading projects: ' + e.message + '</p>';
    }
}

function renderProjectsList(items) {
    if (!items.length) {
        projectsList.innerHTML = '<p class="text-on-surface-variant/50 text-center py-8">No projects found.</p>';
        return;
    }

    projectsList.innerHTML = '';
    items.forEach(data => {
        const card = document.createElement('div');
        card.className = 'group p-4 rounded-xl bg-surface-container-low border border-surface-container hover:border-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4';

        const thumbHtml = data.image 
            ? `<img src="${data.image}" alt="" class="w-12 h-12 rounded-lg object-cover border border-surface-container shrink-0"/>`
            : `<div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0"><span class="material-symbols-outlined text-[20px]">code</span></div>`;

        const flagshipBadge = data.isFlagship 
            ? `<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-label-caps text-[9px] uppercase font-bold tracking-wider">FLAGSHIP</span>` 
            : '';

        const homeBadge = data.featuredOnHome !== false && !data.isFlagship
            ? `<span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-caps text-[9px] uppercase font-bold">HOME</span>`
            : '';

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                ${thumbHtml}
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="font-headline-sm text-sm font-bold text-on-surface truncate">${data.title || 'Untitled Project'}</h4>
                        ${flagshipBadge}
                        ${homeBadge}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-on-surface-variant font-telemetry-code mt-0.5">
                        <span class="uppercase text-secondary font-semibold">${data.category || 'SYS'}</span>
                        <span>•</span>
                        <span class="truncate max-w-[200px]">${data.techStack || 'No tech stack specified'}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button class="toggle-flagship-btn px-2.5 py-1 rounded-full text-xs font-label-caps uppercase font-bold transition-all ${
                    data.isFlagship ? 'bg-secondary-container/20 text-secondary border border-secondary/40' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }" data-id="${data.id}" data-current="${!!data.isFlagship}" title="Toggle Flagship status">
                    ${data.isFlagship ? '★ FLAGSHIP' : 'SET FLAGSHIP'}
                </button>
                <button class="edit-project-btn p-2 rounded-lg bg-surface-container hover:bg-secondary/15 hover:text-secondary text-on-surface-variant transition-colors" data-id="${data.id}" title="Edit Project">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button class="delete-project-btn p-2 rounded-lg bg-surface-container hover:bg-error/15 hover:text-error text-on-surface-variant transition-colors" data-id="${data.id}" title="Delete Project">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        `;
        projectsList.appendChild(card);
    });

    projectsList.querySelectorAll('.toggle-flagship-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const current = e.currentTarget.getAttribute('data-current') === 'true';
            e.currentTarget.disabled = true;
            await updateDoc(doc(db, 'projects', id), { isFlagship: !current });
            showToast("Flagship project designation updated.");
            loadProjects();
        };
    });

    projectsList.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.onclick = (e) => editProject(e.currentTarget.getAttribute('data-id'));
    });

    projectsList.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete("Delete this project?", async () => {
                await deleteDoc(doc(db, 'projects', id));
                showToast("Project deleted.");
                loadProjects();
            });
        };
    });
}

if (projectsSearch) {
    projectsSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = cachedProjects.filter(p => 
            (p.title && p.title.toLowerCase().includes(val)) ||
            (p.techStack && p.techStack.toLowerCase().includes(val))
        );
        renderProjectsList(filtered);
    });
}

// ========================================================
// 3. TEAM & LEADERSHIP ROSTER MANAGEMENT
// ========================================================
const teamCol = collection(db, 'team');
const addTeamForm = document.getElementById('add-team-form');
const teamList = document.getElementById('team-list');
const teamSearch = document.getElementById('team-search');
let cachedTeam = [];

addTeamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('tm-submit-btn');
    const editId = document.getElementById('tm-edit-id').value;
    const isEditing = !!editId;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>${isEditing ? 'Updating...' : 'Registering...'}</span>`;

    try {
        const fileInput = document.getElementById('tm-image-file');
        const urlInput = document.getElementById('tm-image');
        const hasNewFile = fileInput && fileInput.files && fileInput.files[0];
        const hasNewUrl = urlInput && urlInput.value.trim();

        const rawOrder = document.getElementById('tm-order').value.trim();
        const memberOrder = (rawOrder !== '' && !isNaN(Number(rawOrder))) ? Number(rawOrder) : 10;

        const memberData = {
            name: document.getElementById('tm-name').value.trim(),
            role: document.getElementById('tm-role').value.trim(),
            category: document.getElementById('tm-category').value,
            order: memberOrder,
            linkedin: document.getElementById('tm-linkedin').value.trim(),
            github: document.getElementById('tm-github').value.trim(),
            skills: document.getElementById('tm-skills').value.trim(),
            quote: document.getElementById('tm-quote').value.trim(),
            featuredOnHome: document.getElementById('tm-featured-home').checked
        };

        if (isEditing) {
            if (hasNewFile || hasNewUrl) {
                memberData.image = await getImageValue('tm-image-file', 'tm-image');
            }
            await updateDoc(doc(db, 'team', editId), memberData);
            showToast("Member profile updated!");
        } else {
            memberData.image = await getImageValue('tm-image-file', 'tm-image');
            memberData.createdAt = serverTimestamp();
            await addDoc(teamCol, memberData);
            showToast("Team member added to roster!");
        }

        cancelTeamEdit();
        await loadTeam();
    } catch (error) {
        console.error("Error saving team member:", error);
        showToast("Error saving member: " + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">person_add</span><span>Save Member</span>';
    }
});

async function editTeamMember(docId) {
    try {
        const docSnap = await getDoc(doc(db, 'team', docId));
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        document.getElementById('tm-edit-id').value = docId;
        document.getElementById('tm-name').value = data.name || '';
        document.getElementById('tm-role').value = data.role || '';
        document.getElementById('tm-category').value = data.category || 'leadership';
        document.getElementById('tm-order').value = (data.order !== undefined && data.order !== null && !isNaN(Number(data.order))) ? Number(data.order) : 10;
        document.getElementById('tm-linkedin').value = data.linkedin || '';
        document.getElementById('tm-github').value = data.github || '';
        document.getElementById('tm-skills').value = data.skills || '';
        document.getElementById('tm-quote').value = data.quote || '';
        document.getElementById('tm-featured-home').checked = data.featuredOnHome !== false;

        if (data.image) {
            document.getElementById('tm-preview-img').src = data.image;
            document.getElementById('tm-image-preview').classList.remove('hidden');
        }

        document.getElementById('team-form-title').textContent = "Edit Member";
        document.getElementById('tm-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">edit</span><span>Update Member</span>';
        document.getElementById('tm-cancel-edit-btn').classList.remove('hidden');

        document.getElementById('team-form-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
        showToast("Error loading member: " + err.message, 'error');
    }
}

function cancelTeamEdit() {
    document.getElementById('tm-edit-id').value = '';
    addTeamForm.reset();
    document.getElementById('tm-order').value = '10';
    document.getElementById('tm-image-preview').classList.add('hidden');
    document.getElementById('team-form-title').textContent = "Add Team Member";
    document.getElementById('tm-submit-btn').innerHTML = '<span class="material-symbols-outlined text-[18px]">person_add</span><span>Save Member</span>';
    document.getElementById('tm-cancel-edit-btn').classList.add('hidden');
}

document.getElementById('tm-cancel-edit-btn').addEventListener('click', cancelTeamEdit);

const defaultTeamRoster = [
    {
        name: "Anish Mogam",
        role: "Founder",
        category: "leadership",
        order: 1,
        image: "assets/images/anish.jpg",
        linkedin: "https://www.linkedin.com/in/anish-mogam/",
        github: "https://github.com/Anish1302D",
        skills: "Distributed Systems, Architecture, Cloud",
        quote: "Architecting decentralized paradigms.",
        featuredOnHome: true
    },
    {
        name: "Madhura Lakade",
        role: "Co-Founder",
        category: "leadership",
        order: 2,
        image: "assets/images/madhura.jpg",
        linkedin: "https://www.linkedin.com/in/madhura-lakade/",
        github: "",
        skills: "UI/UX, Frontend Architecture, Product",
        quote: "Designing seamless frontier interactions.",
        featuredOnHome: true
    },
    {
        name: "Shreyash Atre",
        role: "Co-Founder",
        category: "leadership",
        order: 3,
        image: "assets/images/shreyash.jpg",
        linkedin: "https://www.linkedin.com/in/shreyash-atre-901340317/",
        github: "https://github.com/shreyash0216",
        skills: "Full Stack, AI Systems, Cloud Engineering",
        quote: "Scaling resilient systems for tomorrow.",
        featuredOnHome: true
    },
    {
        name: "Shreyas Gore",
        role: "Manager",
        category: "core",
        order: 4,
        image: "assets/images/shreyasgore.jpg",
        linkedin: "",
        github: "",
        skills: "Operations, Team Leadership, Strategy",
        quote: "Coordinating high-velocity technical teams.",
        featuredOnHome: true
    },
    {
        name: "Isha Joshi",
        role: "Administrator",
        category: "core",
        order: 5,
        image: "assets/images/isha.jpg",
        linkedin: "https://www.linkedin.com/in/isha-joshi-4b1074319/",
        github: "https://github.com/ishaj306",
        skills: "Community Management, Ecosystem Growth",
        quote: "Streamlining operations and ecosystem growth.",
        featuredOnHome: true
    },
    {
        name: "Mihir Mendake",
        role: "Core Team Lead",
        category: "core",
        order: 6,
        image: "assets/images/mihir.jpg",
        linkedin: "",
        github: "",
        skills: "Systems Programming, Backend Architecture",
        quote: "Engineering mission-critical backends.",
        featuredOnHome: true
    },
    {
        name: "Ayush Teli",
        role: "Core Team Lead",
        category: "core",
        order: 7,
        image: "assets/images/ayush.jpg",
        linkedin: "",
        github: "",
        skills: "Full-Stack Development, Node.js, Cloud",
        quote: "Empowering developers to ship faster.",
        featuredOnHome: true
    },
    {
        name: "Siddheshwar Hinge",
        role: "Contributor",
        category: "lead",
        order: 8,
        image: "assets/images/siddheshwar.jpg",
        linkedin: "",
        github: "",
        skills: "AI/ML, Data Engineering, Python",
        quote: "Pushing boundaries with intelligent models.",
        featuredOnHome: true
    },
    {
        name: "Vaibhav Bandgar",
        role: "Contributor",
        category: "lead",
        order: 9,
        image: "assets/images/vaibhav.jpg",
        linkedin: "",
        github: "",
        skills: "DevOps, Infrastructure, Containerization",
        quote: "Automating zero-downtime infrastructure.",
        featuredOnHome: true
    },
    {
        name: "Om Shinde",
        role: "Contributor",
        category: "lead",
        order: 10,
        image: "assets/images/sphere-logo.png",
        linkedin: "",
        github: "",
        skills: "Web Development, Open Source, Security",
        quote: "Contributing to the future of decentralized tech.",
        featuredOnHome: true
    }
];

let isSyncingRoster = false;
async function syncTeamRosterDefaults(interactive = true) {
    if (isSyncingRoster) return;
    isSyncingRoster = true;

    const repairBtn = document.getElementById('repair-roster-btn');
    if (repairBtn) {
        repairBtn.disabled = true;
        repairBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Syncing...</span>';
    }

    try {
        const snapshot = await getDocs(teamCol);
        const existingDocs = [];
        snapshot.forEach(docSnap => {
            existingDocs.push({ id: docSnap.id, ...docSnap.data() });
        });

        // 1. Identify and purge any duplicate Firestore documents
        const seenNames = new Set();
        const uniqueExisting = [];
        for (const docData of existingDocs) {
            const normName = (docData.name || '').toLowerCase().trim();
            if (!normName) continue;
            if (seenNames.has(normName)) {
                console.log("[Admin] Purging duplicate document from Firestore:", docData.id, docData.name);
                await deleteDoc(doc(db, 'team', docData.id));
            } else {
                seenNames.add(normName);
                uniqueExisting.push(docData);
            }
        }

        // 2. Synchronize each member in defaultTeamRoster
        for (const def of defaultTeamRoster) {
            const defNameLower = def.name.toLowerCase().trim();
            const found = uniqueExisting.find(m => (m.name || '').toLowerCase().trim() === defNameLower);

            if (found) {
                const updates = {};
                if (found.order !== def.order) updates.order = def.order;
                if (!found.role && def.role) updates.role = def.role;
                if (!found.image && def.image) updates.image = def.image;
                if (Object.keys(updates).length > 0) {
                    await updateDoc(doc(db, 'team', found.id), updates);
                }
            } else {
                await addDoc(teamCol, {
                    ...def,
                    createdAt: serverTimestamp()
                });
            }
        }

        if (interactive) {
            showToast("Cleaned duplicates & mapped all 10 members to 1..10 order!");
        }
        await loadTeam();
    } catch (err) {
        console.error("Error syncing roster:", err);
        if (interactive) {
            showToast("Failed to sync roster: " + err.message, "error");
        }
    } finally {
        isSyncingRoster = false;
        if (repairBtn) {
            repairBtn.disabled = false;
            repairBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">auto_fix_high</span><span>Sync 1..10 Defaults</span>';
        }
    }
}

const repairRosterBtn = document.getElementById('repair-roster-btn');
if (repairRosterBtn) {
    repairRosterBtn.addEventListener('click', () => syncTeamRosterDefaults(true));
}

async function loadTeam() {
    teamList.innerHTML = '<p class="text-on-surface-variant/60 text-center py-8">Fetching roster...</p>';
    try {
        const q = query(teamCol);
        const snapshot = await getDocs(q);
        
        // Filter out duplicate entries and clean up duplicates in Firestore
        const seen = new Set();
        const duplicatesToDelete = [];
        cachedTeam = [];

        snapshot.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            const normName = (data.name || '').toLowerCase().trim();
            if (normName && seen.has(normName)) {
                duplicatesToDelete.push(docSnap.id);
            } else {
                if (normName) seen.add(normName);
                cachedTeam.push(data);
            }
        });

        // Automatically delete duplicate entries from Firestore in the background
        if (duplicatesToDelete.length > 0) {
            duplicatesToDelete.forEach(async (dupId) => {
                try { await deleteDoc(doc(db, 'team', dupId)); } catch (e) {}
            });
        }

        // Strict sort by priority order (ascending: #1, #2, #3...), then name alphabetically
        cachedTeam.sort((a, b) => {
            const oA = (a.order !== undefined && a.order !== null && !isNaN(Number(a.order))) ? Number(a.order) : 999;
            const oB = (b.order !== undefined && b.order !== null && !isNaN(Number(b.order))) ? Number(b.order) : 999;
            if (oA !== oB) return oA - oB;
            return (a.name || '').localeCompare(b.name || '');
        });

        if (metricTeam) metricTeam.textContent = cachedTeam.length;
        renderTeamList(cachedTeam);
    } catch (e) {
        teamList.innerHTML = '<p class="text-error text-center py-8">Error loading roster: ' + e.message + '</p>';
    }
}

function renderTeamList(items) {
    if (!items.length) {
        teamList.innerHTML = '<p class="text-on-surface-variant/50 text-center py-8">No members found.</p>';
        return;
    }

    teamList.innerHTML = '';
    items.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'group p-4 rounded-xl bg-surface-container-low border border-surface-container hover:border-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4';

        const thumbHtml = data.image 
            ? `<img src="${data.image}" alt="" class="w-12 h-12 rounded-full object-cover border-2 border-secondary/60 shrink-0" onerror="this.onerror=null; this.src='assets/images/sphere-logo.png';"/>`
            : `<div class="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-bold text-sm shrink-0">${(data.name || 'M')[0]}</div>`;

        const homeBadge = data.featuredOnHome !== false 
            ? `<span class="px-2 py-0.5 rounded-full bg-secondary-container/15 text-secondary font-label-caps text-[9px] uppercase font-bold">LEADERSHIP</span>` 
            : '';

        const orderNum = (data.order !== undefined && data.order !== null && !isNaN(Number(data.order))) ? Number(data.order) : (index + 1);

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                ${thumbHtml}
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded-md bg-secondary/10 border border-secondary/20 text-secondary font-telemetry-code text-[11px] font-bold" title="Display Priority: #${orderNum}">
                            #${orderNum}
                        </span>
                        <h4 class="font-headline-sm text-sm font-bold text-on-surface truncate">${data.name || 'Member'}</h4>
                        ${homeBadge}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-on-surface-variant font-telemetry-code mt-0.5">
                        <span class="text-secondary font-semibold">${data.role || 'Contributor'}</span>
                        <span class="text-on-surface-variant/40">•</span>
                        <span class="uppercase text-[10px] text-on-surface-variant/70">${data.category || 'core'}</span>
                        ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="hover:text-secondary text-[11px] ml-1">LinkedIn</a>` : ''}
                        ${data.github ? `<a href="${data.github}" target="_blank" class="hover:text-secondary text-[11px]">GitHub</a>` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                <div class="flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high" title="Reorder Priority (Swaps with neighbor)">
                    <button class="quick-order-btn p-1 text-on-surface-variant hover:text-secondary hover:bg-surface-container-highest rounded transition-colors" data-id="${data.id}" data-delta="-1" title="Move Up (Swap with member above)">
                        <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                    <span class="px-1.5 text-xs font-telemetry-code font-bold text-on-surface">${orderNum}</span>
                    <button class="quick-order-btn p-1 text-on-surface-variant hover:text-secondary hover:bg-surface-container-highest rounded transition-colors" data-id="${data.id}" data-delta="1" title="Move Down (Swap with member below)">
                        <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </button>
                </div>
                <button class="edit-team-btn p-2 rounded-lg bg-surface-container hover:bg-secondary/15 hover:text-secondary text-on-surface-variant transition-colors" data-id="${data.id}" title="Edit Member">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button class="delete-team-btn p-2 rounded-lg bg-surface-container hover:bg-error/15 hover:text-error text-on-surface-variant transition-colors" data-id="${data.id}" title="Delete Member">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
            </div>
        `;
        teamList.appendChild(card);
    });

    // Neighbor swap reordering
    teamList.querySelectorAll('.quick-order-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const delta = parseInt(e.currentTarget.getAttribute('data-delta'), 10);
            
            const currentIndex = cachedTeam.findIndex(m => m.id === id);
            if (currentIndex === -1) return;

            const targetIndex = currentIndex + delta;
            if (targetIndex < 0) {
                showToast("Already at top priority (#1)!");
                return;
            }
            if (targetIndex >= cachedTeam.length) {
                showToast("Already at lowest priority!");
                return;
            }

            const currentMember = cachedTeam[currentIndex];
            const targetMember = cachedTeam[targetIndex];

            let currentOrder = (currentMember.order !== undefined && currentMember.order !== null && !isNaN(Number(currentMember.order))) ? Number(currentMember.order) : (currentIndex + 1);
            let targetOrder = (targetMember.order !== undefined && targetMember.order !== null && !isNaN(Number(targetMember.order))) ? Number(targetMember.order) : (targetIndex + 1);

            if (currentOrder === targetOrder) {
                currentOrder = currentIndex + 1;
                targetOrder = targetIndex + 1;
            }

            // Cleanly swap order numbers
            const newCurrentOrder = targetOrder;
            const newTargetOrder = currentOrder;

            e.currentTarget.disabled = true;
            try {
                await updateDoc(doc(db, 'team', currentMember.id), { order: newCurrentOrder });
                await updateDoc(doc(db, 'team', targetMember.id), { order: newTargetOrder });
                showToast(`Moved ${currentMember.name} to #${newCurrentOrder}`);
                await loadTeam();
            } catch (err) {
                showToast("Failed to reorder: " + err.message, "error");
            }
        };
    });

    teamList.querySelectorAll('.edit-team-btn').forEach(btn => {
        btn.onclick = (e) => editTeamMember(e.currentTarget.getAttribute('data-id'));
    });

    teamList.querySelectorAll('.delete-team-btn').forEach(btn => {
        btn.onclick = (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            confirmDelete("Remove this member from the roster?", async () => {
                await deleteDoc(doc(db, 'team', id));
                showToast("Member removed from roster.");
                loadTeam();
            });
        };
    });
}

if (teamSearch) {
    teamSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = cachedTeam.filter(m => 
            (m.name && m.name.toLowerCase().includes(val)) ||
            (m.role && m.role.toLowerCase().includes(val))
        );
        renderTeamList(filtered);
    });
}

// ========================================================
// 4. HOMEPAGE TELEMETRY SETTINGS LOGIC
// ========================================================
const homeSettingsForm = document.getElementById('home-settings-form');
const settingsDocRef = doc(db, 'settings', 'home');

async function loadHomeSettings() {
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('hs-hackathon').value = data.hackathon || '';
            document.getElementById('hs-projects').value = data.projectsCount || '';
            document.getElementById('hs-members').value = data.membersCount || '';
            document.getElementById('hs-meetup').value = data.meetup || '';
        }
    } catch (e) {
        console.error("Error loading home settings:", e);
    }
}

homeSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = homeSettingsForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Saving...</span>';

    try {
        await setDoc(settingsDocRef, {
            hackathon: document.getElementById('hs-hackathon').value.trim(),
            projectsCount: document.getElementById('hs-projects').value.trim(),
            membersCount: document.getElementById('hs-members').value.trim(),
            meetup: document.getElementById('hs-meetup').value.trim(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        const successMsg = document.getElementById('hs-success');
        successMsg.classList.remove('hidden');
        showToast("Homepage telemetry stats saved to Firestore!");
        setTimeout(() => successMsg.classList.add('hidden'), 4000);
    } catch (error) {
        console.error("Error saving settings:", error);
        showToast("Error saving telemetry: " + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span><span>Save Telemetry Metrics</span>';
    }
});

// ========================================================
// 5. HOMEPAGE SHOWCASE SETTINGS LOGIC
// (Featured Events & Leadership Constellation)
// ========================================================
const showcaseDocRef = doc(db, 'settings', 'homepage_showcase');

const eventCategoryPresets = {
    hackathon: {
        badge: "REGISTRATION OPEN",
        duration: "36-HOUR SPRINT",
        btnText: "REGISTER FREE",
        btnStyle: "shimmer",
        venue: "HYBRID / SF BAY & VIRTUAL",
        badgeClasses: "bg-secondary-container text-on-secondary",
        label: "HACKATHON"
    },
    workshop: {
        badge: "HANDS-ON WORKSHOP",
        duration: "2.5 HOURS",
        btnText: "RESERVE SEAT",
        btnStyle: "surface",
        venue: "DISCORD STAGE // 6PM EST",
        badgeClasses: "bg-surface-container-high text-on-surface",
        label: "WORKSHOP"
    },
    demoday: {
        badge: "PITCH & INCUBATOR",
        duration: "DEMO DAY",
        btnText: "ATTEND DEMO",
        btnStyle: "surface",
        venue: "MAIN AMPHITHEATRE & LIVE STREAM",
        badgeClasses: "bg-secondary-container/15 text-secondary",
        label: "DEMO DAY"
    },
    meetup: {
        badge: "COMMUNITY MEETUP",
        duration: "LIVE SPRINT",
        btnText: "RSVP NOW",
        btnStyle: "surface",
        venue: "CAMPUS COMMONS // HYBRID",
        badgeClasses: "bg-emerald-500/10 text-emerald-600",
        label: "MEETUP"
    }
};

const BUILDING_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5EtFqdesM_k9uRXfOJDvg89DQ7nwP9XyRrkjA1bZN4BpZ3kVu91qOrAlaCIgf4D8-MOqjMRSuTEEMJAc2iAfyGHzBKQsVOoNdVNAovX_REjOMMWyhtqTJs79OhwBexym_tfMoNqenmOyOBoLVrj5M9NWxcvJ_7HLe8cLIfjakdJ5HLSSJmSVC4Bskxk1hWhZnubJgN3HqVthEgZx8raZ71z9DOV9fPvPce4rOQtGpE0LlP-LX4RkZI91YAYOeeeveg';

const workspacePresets = {
    digital: {
        preset: 'digital',
        name: 'Digital Workspace (Discord & GitHub Hub)',
        category: 'DIGITAL ECOSYSTEM & PLATFORMS',
        title: 'SPHERE DIGITAL WORKSPACE',
        desc: 'The 24/7 virtual engineering campus for distributed pair programming, open-source sprints, and asynchronous collaboration.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'PLATFORMS // DISCORD & GITHUB MONOREPO',
        badgeBottomLeft: 'STATUS: ONLINE BUILDER MESH // 24/7 CHANNELS',
        badgeBottomRight: 'OPEN ACCESS',
        cards: [
            {
                icon: 'forum',
                title: 'Discord Virtual Campus & Voice Lounges',
                desc: '24/7 lofi coding channels, pair-programming rooms, and live bug-triage sessions with peer engineers.'
            },
            {
                icon: 'terminal',
                title: 'GitHub Monorepo & Open Source Pipelines',
                desc: 'Shared organizational repositories, automated CI/CD checks, issue sprints, and public project showcases.'
            },
            {
                icon: 'auto_stories',
                title: 'Resource Vault & Knowledge Base',
                desc: 'Curated system design guides, interview cheat-sheets, roadmap trackers, and collegiate project templates.'
            }
        ],
        btn1Text: 'JOIN DISCORD WORKSPACE',
        btn1Link: '#join',
        btn2Text: 'EXPLORE GITHUB ORG',
        btn2Link: 'https://github.com/Sphere-Club/Sphere-Coding-Club'
    },
    campus: {
        preset: 'campus',
        name: 'Campus Labs & Hackathon Meetups',
        category: 'COLLEGIATE HUBS & GATHERINGS',
        title: 'SPHERE CAMPUS HUBS',
        desc: 'Where collegiate builders gather in real life for weekend sprints, hackathon takeovers, and architecture reviews.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'CAMPUS HUBS // LABS & SEMINAR ROOMS',
        badgeBottomLeft: 'STATUS: ACTIVE MEETUPS // COHORTS SYNCED',
        badgeBottomRight: 'CAMPUS COMMUNITY',
        cards: [
            {
                icon: 'computer',
                title: 'Campus Lab Sprints & Jam Sessions',
                desc: 'Bi-weekly in-person weekend hacking in computer labs, turning theoretical assignments into deployed products.'
            },
            {
                icon: 'emoji_events',
                title: 'Hackathon War Rooms & Squad Takeovers',
                desc: 'Dedicated tables and overnight squad coordination during major collegiate and national hackathons.'
            },
            {
                icon: 'co_present',
                title: 'Founder Circles & Tech Talks',
                desc: 'Informal project demos, lightning tech talks, and frank peer feedback on architecture and product design.'
            }
        ],
        btn1Text: 'FIND OUR SQUAD ON CAMPUS',
        btn1Link: '#events',
        btn2Text: 'VIEW UPCOMING MEETUPS',
        btn2Link: '#events'
    },
    perks: {
        preset: 'perks',
        name: 'Builder Perks & Member Support',
        category: 'ENGINEERING ACCELERATION & PERKS',
        title: 'SPHERE BUILDER PERKS',
        desc: 'Everything you need to ship production-grade software without hitting paywalls or getting stuck.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'RESOURCES // DEV CLOUDS & MENTORS',
        badgeBottomLeft: 'STATUS: COHORTS FUNDED // CREDITS POOLED',
        badgeBottomRight: 'MEMBER ACCESS',
        cards: [
            {
                icon: 'cloud_done',
                title: 'Cloud Sandboxes & Compute Credits',
                desc: 'Free cloud deployment environments, API tier access, shared databases, and hosting for approved squad projects.'
            },
            {
                icon: 'code_blocks',
                title: '1-on-1 Code & Architecture Reviews',
                desc: 'Direct feedback on your pull requests from senior core leads before deploying to real users.'
            },
            {
                icon: 'groups',
                title: 'Hackathon Teaming & Sponsorship',
                desc: 'Pair with skilled teammates, get pitch deck reviews, and receive travel support for prestigious competitions.'
            }
        ],
        btn1Text: 'APPLY FOR COHORT PERKS',
        btn1Link: '#join',
        btn2Text: 'VIEW MEMBER BENEFITS',
        btn2Link: '#about'
    },
    physical: {
        preset: 'physical',
        name: 'Physical Workspace (Original Building & Labs)',
        category: 'PHYSICAL INFRASTRUCTURE & HUBS',
        title: 'SPHERE WORKSPACE',
        desc: 'The physical epicenter for deep-tech research, high-throughput hackathons, and hardware-software co-engineering.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'LOCATION // SECTOR 04 - TECH CORRIDOR',
        badgeBottomLeft: 'STATUS: ACTIVE BUILDER HUB // CAPACITY 350+ SEATS',
        badgeBottomRight: '24/7 BADGE ACCESS',
        cards: [
            {
                icon: 'precision_manufacturing',
                title: 'Rapid Prototyping Lab',
                desc: '24/7 access to high-compute clusters, 3D printers, and edge hardware benches.'
            },
            {
                icon: 'co_present',
                title: 'Collaborative Amphitheatre',
                desc: 'Dedicated space for keynote livestreams, founder pitch decks, and internal demo days.'
            },
            {
                icon: 'workspaces',
                title: 'Open Hacker Commons',
                desc: 'Zero-distraction quiet pods, gigabit fiber mesh, and ergonomic pairing stations.'
            }
        ],
        btn1Text: 'EXPLORE VIRTUAL CAMPUS TOUR',
        btn1Link: '#workspace',
        btn2Text: 'REQUEST DESK PASS',
        btn2Link: '#join'
    }
};

const defaultShowcaseData = {
    noEvents: false,
    emptyState: {
        title: "No Live Gatherings Scheduled Right Now",
        desc: "Our core leads are architecting the next cycle of collegiate hackathons, production workshops, and founder pitch sessions. Join our community Discord to be the first to receive invitations!",
        btnText: "JOIN DISCORD",
        btnLink: "#join"
    },
    noProjects: false,
    emptyStateProjects: {
        title: "Production Systems Under Active Architecture",
        desc: "Our student squads are currently architecting the next cycle of open-source projects, AI copilots, and distributed systems. Explore our GitHub or check back soon!",
        btnText: "EXPLORE GITHUB",
        btnLink: "https://github.com/Sphere-Club/Sphere-Coding-Club"
    },
    workspace: workspacePresets.digital,
    events: [
        {
            enabled: true,
            category: "hackathon",
            btnStyle: "shimmer",
            month: "OCT",
            day: "24",
            badge: "REGISTRATION OPEN",
            duration: "36-HOUR SPRINT",
            title: "SphereHacks 2026: National Collegiate Hackathon",
            desc: "400+ developers, $10,000 in equity-free prize bounties, world-class mentors from leading tech unicorns, and live demo showcase.",
            venue: "HYBRID / SF BAY & VIRTUAL",
            btnText: "REGISTER FREE",
            btnLink: "#join"
        },
        {
            enabled: true,
            category: "workshop",
            btnStyle: "surface",
            month: "NOV",
            day: "08",
            badge: "HANDS-ON WORKSHOP",
            duration: "2.5 HOURS",
            title: "Zero to Production with Kubernetes & Cloud Native",
            desc: "Live interactive coding session configuring automated ingress controllers, zero-downtime rolling deploys, and cluster logging.",
            venue: "DISCORD STAGE // 6PM EST",
            btnText: "RESERVE SEAT",
            btnLink: "#join"
        },
        {
            enabled: true,
            category: "demoday",
            btnStyle: "surface",
            month: "DEC",
            day: "02",
            badge: "PITCH & INCUBATOR",
            duration: "DEMO DAY",
            title: "Sphere Demo Day & Founder Pitch Showcase",
            desc: "Top 8 incubated student squads demonstrate production deployments to invited seed angel investors and engineering leaders.",
            venue: "MAIN AMPHITHEATRE & LIVE STREAM",
            btnText: "ATTEND DEMO",
            btnLink: "#join"
        }
    ],
    founders: [
        {
            name: "ANISH MOGAM",
            role: "FOUNDER",
            orbStyle: "globe-3d-deep",
            image: "assets/images/anish.jpg",
            quote: "Building a brighter tomorrow, together.",
            interests: "Technology\nInnovation\nCommunities",
            skills: "Leadership\nProduct Thinking\nProblem Solving",
            funFact: "Always curious about what's next!"
        },
        {
            name: "MADHURA LAKADE",
            role: "CO-FOUNDER",
            orbStyle: "globe-3d-pearl",
            image: "assets/images/madhura.jpg",
            quote: "Turning ideas into impact, together.",
            interests: "Technology\nProduct Design\nCommunities",
            skills: "Strategic Thinking\nTeam Building\nProblem Solving",
            funFact: "Always excited about real impact!"
        },
        {
            name: "SHREYASH ATRE",
            role: "CO-FOUNDER",
            orbStyle: "globe-3d-azure",
            image: "assets/images/shreyash.jpg",
            quote: "Building ideas into 'impact, together.'*",
            interests: "Technology\nProduct Dev\nOpen Source",
            skills: "Problem Solving\nSystems Thinking\nCollaboration",
            funFact: "Always curious how things work!"
        }
    ],
    leads: [
        {
            name: "MIHIR MENDAKE",
            role: "CORE TEAM LEAD",
            image: "assets/images/mihir.jpg",
            quote: "Driving ideas forward, together.",
            interests: "Tech, Products, Hackathons",
            skills: "Leadership, Project Mgmt",
            funFact: "Up for new challenges!"
        },
        {
            name: "ISHA JOSHI",
            role: "ADMINISTRATOR",
            image: "assets/images/isha.jpg",
            quote: "Creating a smoother today for a stronger tomorrow.",
            interests: "Community, Event Mgmt, Design",
            skills: "Organization, Communication",
            funFact: "Every detail counts!"
        },
        {
            name: "SHREYAS GORE",
            role: "MANAGER",
            image: "assets/images/shreyasgore.jpg",
            quote: "Turning plans into progress, together.",
            interests: "Strategy, Organization, Building",
            skills: "Planning, Team Coordination",
            funFact: "Good teams make ideas real!"
        }
    ]
};

// Helper getters and setters
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
}

// Subtab switcher for tab-showcase
const scSubtabBtns = document.querySelectorAll('.sc-subtab-btn');
const scSections = document.querySelectorAll('.sc-section');

scSubtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        scSubtabBtns.forEach(b => {
            b.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
            b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
        btn.classList.remove('text-on-surface-variant');

        const targetId = btn.getAttribute('data-sc-target');
        scSections.forEach(sec => {
            if (sec.id === targetId) sec.classList.remove('hidden');
            else sec.classList.add('hidden');
        });
    });
});

// "No Events Right Now" toggle handler
function markShowcaseDirty() {
    const statusText = document.getElementById('sc-save-status-text');
    if (statusText) statusText.textContent = 'Unsaved changes — click Save Showcase to publish to home';
    const statusDot = document.getElementById('sc-save-status-dot');
    if (statusDot) statusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
}

const scNoEventsCheckbox = document.getElementById('sc-ev-no-events');
const scEmptyPanel = document.getElementById('sc-ev-empty-panel');
if (scNoEventsCheckbox && scEmptyPanel) {
    scNoEventsCheckbox.addEventListener('change', () => {
        scEmptyPanel.classList.toggle('hidden', !scNoEventsCheckbox.checked);
        markShowcaseDirty();
    });
}

const tabShowcase = document.getElementById('tab-showcase');
if (tabShowcase) {
    tabShowcase.addEventListener('input', markShowcaseDirty);
    tabShowcase.addEventListener('change', markShowcaseDirty);
}

// "No Projects Right Now" toggle handler (Synced across tab-projects and tab-showcase)
const scNoProjectsCheckbox = document.getElementById('sc-proj-no-projects');
const projNoProjectsCheckbox = document.getElementById('proj-no-projects');
const scProjEmptyPanel = document.getElementById('sc-proj-empty-panel');
const projEmptyPanel = document.getElementById('proj-empty-panel');

function handleNoProjectsToggle(isChecked) {
    if (scNoProjectsCheckbox) scNoProjectsCheckbox.checked = isChecked;
    if (projNoProjectsCheckbox) projNoProjectsCheckbox.checked = isChecked;
    if (scProjEmptyPanel) scProjEmptyPanel.classList.toggle('hidden', !isChecked);
    if (projEmptyPanel) projEmptyPanel.classList.toggle('hidden', !isChecked);
    markShowcaseDirty();
    const projStatus = document.getElementById('proj-save-status-text');
    if (projStatus) projStatus.textContent = 'Unsaved changes — click Save Projects Homepage State';
}

if (scNoProjectsCheckbox) {
    scNoProjectsCheckbox.addEventListener('change', (e) => handleNoProjectsToggle(e.target.checked));
}
if (projNoProjectsCheckbox) {
    projNoProjectsCheckbox.addEventListener('change', (e) => handleNoProjectsToggle(e.target.checked));
}

// Two-way sync for projects empty state text fields
const projFieldSyncPairs = [
    ['sc-proj-empty-title', 'proj-empty-title'],
    ['sc-proj-empty-desc', 'proj-empty-desc'],
    ['sc-proj-empty-btn-text', 'proj-empty-btn-text'],
    ['sc-proj-empty-btn-link', 'proj-empty-btn-link']
];

projFieldSyncPairs.forEach(([id1, id2]) => {
    const el1 = document.getElementById(id1);
    const el2 = document.getElementById(id2);
    if (el1 && el2) {
        el1.addEventListener('input', () => { el2.value = el1.value; markShowcaseDirty(); });
        el2.addEventListener('input', () => { el1.value = el2.value; markShowcaseDirty(); });
    }
});

// Switch from Showcase to Projects tab button
const scGotoProjectsBtn = document.getElementById('sc-goto-projects-btn');
if (scGotoProjectsBtn) {
    scGotoProjectsBtn.addEventListener('click', () => {
        const projTabBtn = document.querySelector('.tab-btn[data-target="tab-projects"]');
        if (projTabBtn) projTabBtn.click();
    });
}

// Dedicated Save button in Projects tab
async function saveProjectsHomepageState() {
    const btn = document.getElementById('proj-save-settings-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span><span>Saving...</span>';
    }
    try {
        const noProjects = !!(document.getElementById('proj-no-projects') && document.getElementById('proj-no-projects').checked);
        const emptyStateProjects = {
            title: getVal('proj-empty-title') || defaultShowcaseData.emptyStateProjects.title,
            desc: getVal('proj-empty-desc') || defaultShowcaseData.emptyStateProjects.desc,
            btnText: getVal('proj-empty-btn-text') || defaultShowcaseData.emptyStateProjects.btnText,
            btnLink: getVal('proj-empty-btn-link') || defaultShowcaseData.emptyStateProjects.btnLink
        };

        await setDoc(showcaseDocRef, {
            noProjects,
            emptyStateProjects,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Sync with showcase fields
        const scNoProj = document.getElementById('sc-proj-no-projects');
        if (scNoProj) scNoProj.checked = noProjects;
        const scProjPanel = document.getElementById('sc-proj-empty-panel');
        if (scProjPanel) scProjPanel.classList.toggle('hidden', !noProjects);
        setVal('sc-proj-empty-title', emptyStateProjects.title);
        setVal('sc-proj-empty-desc', emptyStateProjects.desc);
        setVal('sc-proj-empty-btn-text', emptyStateProjects.btnText);
        setVal('sc-proj-empty-btn-link', emptyStateProjects.btnLink);

        const projStatus = document.getElementById('proj-save-status-text');
        if (projStatus) projStatus.textContent = `Saved to Firestore & live on home (${new Date().toLocaleTimeString()})`;

        const scStatus = document.getElementById('sc-save-status-text');
        if (scStatus) scStatus.textContent = `Changes saved to Firestore & live on home (${new Date().toLocaleTimeString()})`;

        showToast("Projects homepage state updated successfully!");
    } catch (e) {
        console.error("Error saving projects homepage state:", e);
        showToast("Error saving projects state: " + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span><span>Save Projects Homepage State</span>';
        }
    }
}

const projSaveSettingsBtn = document.getElementById('proj-save-settings-btn');
if (projSaveSettingsBtn) {
    projSaveSettingsBtn.addEventListener('click', saveProjectsHomepageState);
}

// Update card header badge styling based on category
function updateCardHeaderBadge(idx, category) {
    const badgeEl = document.getElementById(`sc-ev-header-badge-${idx}`);
    if (!badgeEl) return;
    const preset = eventCategoryPresets[category] || eventCategoryPresets.hackathon;
    badgeEl.className = `px-2.5 py-0.5 rounded-full text-[10px] font-telemetry-code uppercase font-bold ${preset.badgeClasses}`;
    badgeEl.textContent = preset.label;
}

// Event Card category select listeners & Preset buttons & Live Title
for (let i = 0; i < 3; i++) {
    const catSelect = document.getElementById(`sc-ev-category-${i}`);
    if (catSelect) {
        catSelect.addEventListener('change', (e) => {
            const cat = e.target.value;
            updateCardHeaderBadge(i, cat);
            const btnStyleSelect = document.getElementById(`sc-ev-btn-style-${i}`);
            if (btnStyleSelect) {
                btnStyleSelect.value = (cat === 'hackathon') ? 'shimmer' : 'surface';
            }
        });
    }

    const titleInput = document.getElementById(`sc-ev-title-${i}`);
    const headerTitle = document.getElementById(`sc-ev-header-title-${i}`);
    if (titleInput && headerTitle) {
        titleInput.addEventListener('input', (e) => {
            headerTitle.textContent = e.target.value.trim() || `Event #${i + 1}`;
        });
    }
}

// Preset application buttons
document.querySelectorAll('.sc-ev-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        const category = getVal(`sc-ev-category-${idx}`) || 'hackathon';
        const preset = eventCategoryPresets[category];
        if (preset) {
            setVal(`sc-ev-badge-${idx}`, preset.badge);
            setVal(`sc-ev-duration-${idx}`, preset.duration);
            setVal(`sc-ev-venue-${idx}`, preset.venue);
            setVal(`sc-ev-btn-text-${idx}`, preset.btnText);
            setVal(`sc-ev-btn-style-${idx}`, preset.btnStyle);
            updateCardHeaderBadge(idx, category);
            showToast(`Applied ${preset.label} defaults to Card #${Number(idx) + 1}!`);
        }
    });
});

// Setup image file & URL previews for Founders & Leads
for (let i = 0; i < 3; i++) {
    // Founder file preview
    const fFileInput = document.getElementById(`sc-f-file-${i}`);
    const fUrlInput = document.getElementById(`sc-f-url-${i}`);
    const fPreviewImg = document.getElementById(`sc-f-preview-img-${i}`);

    if (fFileInput && fPreviewImg) {
        fFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => { fPreviewImg.src = ev.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    if (fUrlInput && fPreviewImg) {
        fUrlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) fPreviewImg.src = val;
        });
    }

    // Lead file preview
    const lFileInput = document.getElementById(`sc-l-file-${i}`);
    const lUrlInput = document.getElementById(`sc-l-url-${i}`);
    const lPreviewImg = document.getElementById(`sc-l-preview-img-${i}`);

    if (lFileInput && lPreviewImg) {
        lFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => { lPreviewImg.src = ev.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    if (lUrlInput && lPreviewImg) {
        lUrlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val) lPreviewImg.src = val;
        });
    }
}

// Workspace Mode preset applicator
function applyWorkspacePreset(presetKey) {
    const preset = workspacePresets[presetKey] || workspacePresets.digital;
    const select = document.getElementById('sc-ws-preset');
    if (select) select.value = presetKey;

    setVal('sc-ws-category', preset.category);
    setVal('sc-ws-title', preset.title);
    setVal('sc-ws-desc', preset.desc);
    setVal('sc-ws-img-url', preset.image || BUILDING_IMAGE_URL);
    setVal('sc-ws-badge-top', preset.badgeTop);
    setVal('sc-ws-badge-bl', preset.badgeBottomLeft);
    setVal('sc-ws-badge-br', preset.badgeBottomRight);

    if (preset.cards && preset.cards[0]) {
        setVal('sc-ws-c1-icon', preset.cards[0].icon);
        setVal('sc-ws-c1-title', preset.cards[0].title);
        setVal('sc-ws-c1-desc', preset.cards[0].desc);
    }
    if (preset.cards && preset.cards[1]) {
        setVal('sc-ws-c2-icon', preset.cards[1].icon);
        setVal('sc-ws-c2-title', preset.cards[1].title);
        setVal('sc-ws-c2-desc', preset.cards[1].desc);
    }
    if (preset.cards && preset.cards[2]) {
        setVal('sc-ws-c3-icon', preset.cards[2].icon);
        setVal('sc-ws-c3-title', preset.cards[2].title);
        setVal('sc-ws-c3-desc', preset.cards[2].desc);
    }

    setVal('sc-ws-b1-text', preset.btn1Text);
    setVal('sc-ws-b1-link', preset.btn1Link);
    setVal('sc-ws-b2-text', preset.btn2Text);
    setVal('sc-ws-b2-link', preset.btn2Link);

    markShowcaseDirty();
    showToast(`Loaded Workspace Mode: ${preset.name}`);
}

const scWsPresetSelect = document.getElementById('sc-ws-preset');
if (scWsPresetSelect) {
    scWsPresetSelect.addEventListener('change', (e) => {
        applyWorkspacePreset(e.target.value);
    });
}

document.querySelectorAll('.sc-ws-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const pKey = e.currentTarget.getAttribute('data-preset');
        if (pKey) applyWorkspacePreset(pKey);
    });
});

// Populate Showcase form
function populateShowcaseForm(data) {
    // No Events toggle & Empty state
    const isNoEvents = !!(data && data.noEvents);
    if (scNoEventsCheckbox) scNoEventsCheckbox.checked = isNoEvents;
    if (scEmptyPanel) scEmptyPanel.classList.toggle('hidden', !isNoEvents);

    const empty = (data && data.emptyState) || defaultShowcaseData.emptyState;
    setVal('sc-ev-empty-title', empty.title);
    setVal('sc-ev-empty-desc', empty.desc);
    setVal('sc-ev-empty-btn-text', empty.btnText);
    setVal('sc-ev-empty-btn-link', empty.btnLink);

    // No Projects toggle & Empty state
    const isNoProjects = !!(data && data.noProjects);
    if (scNoProjectsCheckbox) scNoProjectsCheckbox.checked = isNoProjects;
    if (projNoProjectsCheckbox) projNoProjectsCheckbox.checked = isNoProjects;
    if (scProjEmptyPanel) scProjEmptyPanel.classList.toggle('hidden', !isNoProjects);
    if (projEmptyPanel) projEmptyPanel.classList.toggle('hidden', !isNoProjects);

    const emptyProj = (data && data.emptyStateProjects) || defaultShowcaseData.emptyStateProjects;
    setVal('sc-proj-empty-title', emptyProj.title);
    setVal('sc-proj-empty-desc', emptyProj.desc);
    setVal('sc-proj-empty-btn-text', emptyProj.btnText);
    setVal('sc-proj-empty-btn-link', emptyProj.btnLink);

    setVal('proj-empty-title', emptyProj.title);
    setVal('proj-empty-desc', emptyProj.desc);
    setVal('proj-empty-btn-text', emptyProj.btnText);
    setVal('proj-empty-btn-link', emptyProj.btnLink);

    // Workspace & Hubs Mode
    const ws = (data && data.workspace) || defaultShowcaseData.workspace || workspacePresets.digital;
    const wsEnabled = document.getElementById('sc-ws-enabled');
    if (wsEnabled) wsEnabled.checked = ws.enabled !== false;

    const wsSelect = document.getElementById('sc-ws-preset');
    if (wsSelect) wsSelect.value = ws.preset || 'digital';

    setVal('sc-ws-category', ws.category || workspacePresets.digital.category);
    setVal('sc-ws-title', ws.title || workspacePresets.digital.title);
    setVal('sc-ws-desc', ws.desc || workspacePresets.digital.desc);
    setVal('sc-ws-img-url', ws.image || BUILDING_IMAGE_URL);
    setVal('sc-ws-badge-top', ws.badgeTop || workspacePresets.digital.badgeTop);
    setVal('sc-ws-badge-bl', ws.badgeBottomLeft || workspacePresets.digital.badgeBottomLeft);
    setVal('sc-ws-badge-br', ws.badgeBottomRight || workspacePresets.digital.badgeBottomRight);

    const wsCards = (ws.cards && ws.cards.length === 3) ? ws.cards : workspacePresets.digital.cards;
    setVal('sc-ws-c1-icon', wsCards[0].icon);
    setVal('sc-ws-c1-title', wsCards[0].title);
    setVal('sc-ws-c1-desc', wsCards[0].desc);

    setVal('sc-ws-c2-icon', wsCards[1].icon);
    setVal('sc-ws-c2-title', wsCards[1].title);
    setVal('sc-ws-c2-desc', wsCards[1].desc);

    setVal('sc-ws-c3-icon', wsCards[2].icon);
    setVal('sc-ws-c3-title', wsCards[2].title);
    setVal('sc-ws-c3-desc', wsCards[2].desc);

    setVal('sc-ws-b1-text', ws.btn1Text || workspacePresets.digital.btn1Text);
    setVal('sc-ws-b1-link', ws.btn1Link || workspacePresets.digital.btn1Link);
    setVal('sc-ws-b2-text', ws.btn2Text || workspacePresets.digital.btn2Text);
    setVal('sc-ws-b2-link', ws.btn2Link || workspacePresets.digital.btn2Link);

    const events = (data && data.events && data.events.length) ? data.events : defaultShowcaseData.events;
    const founders = (data && data.founders && data.founders.length) ? data.founders : defaultShowcaseData.founders;
    const leads = (data && data.leads && data.leads.length) ? data.leads : defaultShowcaseData.leads;

    // Events
    for (let i = 0; i < 3; i++) {
        const ev = events[i] || defaultShowcaseData.events[i] || {};
        const enabledCheck = document.getElementById(`sc-ev-enabled-${i}`);
        if (enabledCheck) enabledCheck.checked = ev.enabled !== false;

        const category = ev.category || (i === 0 ? 'hackathon' : (i === 1 ? 'workshop' : 'demoday'));
        setVal(`sc-ev-category-${i}`, category);
        setVal(`sc-ev-btn-style-${i}`, ev.btnStyle || (category === 'hackathon' ? 'shimmer' : 'surface'));
        setVal(`sc-ev-month-${i}`, ev.month);
        setVal(`sc-ev-day-${i}`, ev.day);
        setVal(`sc-ev-badge-${i}`, ev.badge);
        setVal(`sc-ev-duration-${i}`, ev.duration);
        setVal(`sc-ev-title-${i}`, ev.title);
        setVal(`sc-ev-desc-${i}`, ev.desc);
        setVal(`sc-ev-venue-${i}`, ev.venue);
        setVal(`sc-ev-btn-text-${i}`, ev.btnText);
        setVal(`sc-ev-btn-link-${i}`, ev.btnLink);

        updateCardHeaderBadge(i, category);
        const headerTitle = document.getElementById(`sc-ev-header-title-${i}`);
        if (headerTitle) headerTitle.textContent = ev.title || `Event #${i + 1}`;
    }

    // Founders
    for (let i = 0; i < 3; i++) {
        const f = founders[i] || defaultShowcaseData.founders[i] || {};
        setVal(`sc-f-name-${i}`, f.name);
        setVal(`sc-f-role-${i}`, f.role);
        setVal(`sc-f-orb-${i}`, f.orbStyle || (i === 0 ? 'globe-3d-deep' : (i === 1 ? 'globe-3d-pearl' : 'globe-3d-azure')));
        setVal(`sc-f-quote-${i}`, f.quote);
        setVal(`sc-f-interests-${i}`, f.interests);
        setVal(`sc-f-skills-${i}`, f.skills);
        setVal(`sc-f-funfact-${i}`, f.funFact);
        setVal(`sc-f-url-${i}`, f.image || '');
        const imgEl = document.getElementById(`sc-f-preview-img-${i}`);
        if (imgEl && f.image) imgEl.src = f.image;
    }

    // Leads
    for (let i = 0; i < 3; i++) {
        const l = leads[i] || defaultShowcaseData.leads[i] || {};
        setVal(`sc-l-name-${i}`, l.name);
        setVal(`sc-l-role-${i}`, l.role);
        setVal(`sc-l-quote-${i}`, l.quote);
        setVal(`sc-l-interests-${i}`, l.interests);
        setVal(`sc-l-skills-${i}`, l.skills);
        setVal(`sc-l-funfact-${i}`, l.funFact);
        setVal(`sc-l-url-${i}`, l.image || '');
        const imgEl = document.getElementById(`sc-l-preview-img-${i}`);
        if (imgEl && l.image) imgEl.src = l.image;
    }
}

// Load Showcase from Firestore
async function loadHomepageShowcase() {
    try {
        const docSnap = await getDoc(showcaseDocRef);
        if (docSnap.exists()) {
            populateShowcaseForm(docSnap.data());
        } else {
            populateShowcaseForm(defaultShowcaseData);
        }
    } catch (e) {
        console.error("Error loading homepage showcase:", e);
        populateShowcaseForm(defaultShowcaseData);
    }
}

// Compress or get image helper
async function getShowcaseImage(fileInputId, urlInputId, fallbackUrl) {
    const fileInput = document.getElementById(fileInputId);
    if (fileInput && fileInput.files && fileInput.files[0]) {
        return await compressImage(fileInput.files[0], 600, 0.85);
    }
    const urlInput = document.getElementById(urlInputId);
    if (urlInput && urlInput.value.trim()) {
        return urlInput.value.trim();
    }
    return fallbackUrl;
}

// Save Showcase to Firestore
async function saveHomepageShowcase() {
    const saveBtns = [
        document.getElementById('sc-save-btn'),
        document.getElementById('sc-bottom-save-btn')
    ].filter(Boolean);

    saveBtns.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span><span>Saving...</span>';
    });

    try {
        const noEvents = !!(scNoEventsCheckbox && scNoEventsCheckbox.checked);
        const emptyState = {
            title: getVal('sc-ev-empty-title') || defaultShowcaseData.emptyState.title,
            desc: getVal('sc-ev-empty-desc') || defaultShowcaseData.emptyState.desc,
            btnText: getVal('sc-ev-empty-btn-text') || defaultShowcaseData.emptyState.btnText,
            btnLink: getVal('sc-ev-empty-btn-link') || defaultShowcaseData.emptyState.btnLink
        };

        // Collect 3 Events
        const events = [];
        for (let i = 0; i < 3; i++) {
            const enabledCheck = document.getElementById(`sc-ev-enabled-${i}`);
            events.push({
                enabled: enabledCheck ? enabledCheck.checked : true,
                category: getVal(`sc-ev-category-${i}`) || 'hackathon',
                btnStyle: getVal(`sc-ev-btn-style-${i}`) || 'surface',
                month: getVal(`sc-ev-month-${i}`),
                day: getVal(`sc-ev-day-${i}`),
                badge: getVal(`sc-ev-badge-${i}`),
                duration: getVal(`sc-ev-duration-${i}`),
                title: getVal(`sc-ev-title-${i}`),
                desc: getVal(`sc-ev-desc-${i}`),
                venue: getVal(`sc-ev-venue-${i}`),
                btnText: getVal(`sc-ev-btn-text-${i}`),
                btnLink: getVal(`sc-ev-btn-link-${i}`)
            });
        }

        // Collect 3 Founders
        const founders = [];
        for (let i = 0; i < 3; i++) {
            const fallback = defaultShowcaseData.founders[i] ? defaultShowcaseData.founders[i].image : 'assets/images/sphere-logo.png';
            const image = await getShowcaseImage(`sc-f-file-${i}`, `sc-f-url-${i}`, fallback);
            founders.push({
                name: getVal(`sc-f-name-${i}`),
                role: getVal(`sc-f-role-${i}`),
                orbStyle: getVal(`sc-f-orb-${i}`),
                image,
                quote: getVal(`sc-f-quote-${i}`),
                interests: getVal(`sc-f-interests-${i}`),
                skills: getVal(`sc-f-skills-${i}`),
                funFact: getVal(`sc-f-funfact-${i}`)
            });
        }

        // Collect 3 Leads
        const leads = [];
        for (let i = 0; i < 3; i++) {
            const fallback = defaultShowcaseData.leads[i] ? defaultShowcaseData.leads[i].image : 'assets/images/sphere-logo.png';
            const image = await getShowcaseImage(`sc-l-file-${i}`, `sc-l-url-${i}`, fallback);
            leads.push({
                name: getVal(`sc-l-name-${i}`),
                role: getVal(`sc-l-role-${i}`),
                image,
                quote: getVal(`sc-l-quote-${i}`),
                interests: getVal(`sc-l-interests-${i}`),
                skills: getVal(`sc-l-skills-${i}`),
                funFact: getVal(`sc-l-funfact-${i}`)
            });
        }

        const noProjects = !!(
            (document.getElementById('sc-proj-no-projects') && document.getElementById('sc-proj-no-projects').checked) ||
            (document.getElementById('proj-no-projects') && document.getElementById('proj-no-projects').checked)
        );
        const emptyStateProjects = {
            title: getVal('sc-proj-empty-title') || getVal('proj-empty-title') || defaultShowcaseData.emptyStateProjects.title,
            desc: getVal('sc-proj-empty-desc') || getVal('proj-empty-desc') || defaultShowcaseData.emptyStateProjects.desc,
            btnText: getVal('sc-proj-empty-btn-text') || getVal('proj-empty-btn-text') || defaultShowcaseData.emptyStateProjects.btnText,
            btnLink: getVal('sc-proj-empty-btn-link') || getVal('proj-empty-btn-link') || defaultShowcaseData.emptyStateProjects.btnLink
        };

        const wsPreset = getVal('sc-ws-preset') || 'digital';
        const wsEnabled = document.getElementById('sc-ws-enabled') ? document.getElementById('sc-ws-enabled').checked : true;
        const workspace = {
            enabled: wsEnabled,
            preset: wsPreset,
            category: getVal('sc-ws-category') || (workspacePresets[wsPreset] || workspacePresets.digital).category,
            title: getVal('sc-ws-title') || (workspacePresets[wsPreset] || workspacePresets.digital).title,
            desc: getVal('sc-ws-desc') || (workspacePresets[wsPreset] || workspacePresets.digital).desc,
            image: getVal('sc-ws-img-url') || BUILDING_IMAGE_URL,
            badgeTop: getVal('sc-ws-badge-top') || (workspacePresets[wsPreset] || workspacePresets.digital).badgeTop,
            badgeBottomLeft: getVal('sc-ws-badge-bl') || (workspacePresets[wsPreset] || workspacePresets.digital).badgeBottomLeft,
            badgeBottomRight: getVal('sc-ws-badge-br') || (workspacePresets[wsPreset] || workspacePresets.digital).badgeBottomRight,
            cards: [
                {
                    icon: getVal('sc-ws-c1-icon') || 'forum',
                    title: getVal('sc-ws-c1-title') || 'Card 1',
                    desc: getVal('sc-ws-c1-desc') || ''
                },
                {
                    icon: getVal('sc-ws-c2-icon') || 'terminal',
                    title: getVal('sc-ws-c2-title') || 'Card 2',
                    desc: getVal('sc-ws-c2-desc') || ''
                },
                {
                    icon: getVal('sc-ws-c3-icon') || 'auto_stories',
                    title: getVal('sc-ws-c3-title') || 'Card 3',
                    desc: getVal('sc-ws-c3-desc') || ''
                }
            ],
            btn1Text: getVal('sc-ws-b1-text') || '',
            btn1Link: getVal('sc-ws-b1-link') || '#',
            btn2Text: getVal('sc-ws-b2-text') || '',
            btn2Link: getVal('sc-ws-b2-link') || '#'
        };

        await setDoc(showcaseDocRef, {
            noEvents,
            emptyState,
            events,
            founders,
            leads,
            noProjects,
            emptyStateProjects,
            workspace,
            updatedAt: serverTimestamp()
        }, { merge: true });

        const statusText = document.getElementById('sc-save-status-text');
        if (statusText) {
            statusText.textContent = `Changes saved to Firestore & live on home (${new Date().toLocaleTimeString()})`;
        }
        const statusDot = document.getElementById('sc-save-status-dot');
        if (statusDot) {
            statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
        }

        showToast("Homepage showcase updated successfully in Firestore!");
    } catch (error) {
        console.error("Error saving homepage showcase:", error);
        showToast("Error saving showcase: " + error.message, 'error');
    } finally {
        saveBtns.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span><span>Save Showcase</span>';
        });
    }
}

// Wire up save buttons and reset button
const scSaveBtn = document.getElementById('sc-save-btn');
if (scSaveBtn) scSaveBtn.addEventListener('click', saveHomepageShowcase);

const scBottomSaveBtn = document.getElementById('sc-bottom-save-btn');
if (scBottomSaveBtn) scBottomSaveBtn.addEventListener('click', saveHomepageShowcase);

const scResetBtn = document.getElementById('sc-reset-defaults-btn');
if (scResetBtn) {
    scResetBtn.addEventListener('click', () => {
        populateShowcaseForm(defaultShowcaseData);
        showToast("Form restored to default values. Click 'Save Showcase' to apply.");
    });
}


