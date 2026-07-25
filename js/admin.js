console.log('[Admin] Script loading...');

import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log('[Admin] Firebase loaded successfully');

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

console.log('[Admin] Login form found:', !!loginForm);

// --- IMAGE PREVIEW LOGIC ---
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

// --- IMAGE HELPER: Convert to compressed base64 ---
function compressImage(file, maxWidth) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Scale down if larger than maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG at 80% quality for smaller size
                const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataURL);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function getImageURL(fileInputId, urlInputId) {
    const fileInput = document.getElementById(fileInputId);
    const urlInput = document.getElementById(urlInputId);
    
    // Prefer file upload over URL
    if (fileInput && fileInput.files && fileInput.files[0]) {
        return await compressImage(fileInput.files[0], 400);
    }
    // Fall back to URL
    if (urlInput && urlInput.value.trim()) {
        return urlInput.value.trim();
    }
    return '';
}

// --- TABS LOGIC ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
            b.classList.remove('active', 'bg-primary/20', 'text-primary', 'border-primary/50');
            b.classList.add('bg-white/5', 'text-white/70', 'border-transparent');
        });
        btn.classList.add('active', 'bg-primary/20', 'text-primary', 'border-primary/50');
        btn.classList.remove('bg-white/5', 'text-white/70', 'border-transparent');
        
        const targetId = btn.getAttribute('data-target');
        tabContents.forEach(tc => {
            if(tc.id === targetId) tc.classList.remove('hidden');
            else tc.classList.add('hidden');
        });
        
        if(targetId === 'tab-projects') loadProjects();
        if(targetId === 'tab-team') loadTeam();
        if(targetId === 'tab-home') loadHomeSettings();
    });
});

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    console.log('[Admin] Auth state changed:', user ? user.email : 'logged out');
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadEvents();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[Admin] Login form submitted');
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    const submitBtn = loginForm.querySelector('button');
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        console.log('[Admin] Attempting sign in with:', email);
        await signInWithEmailAndPassword(auth, email, password);
        console.log('[Admin] Sign in successful!');
        loginError.classList.add('hidden');
    } catch (error) {
        console.error('[Admin] Sign in error:', error.code, error.message);
        loginError.textContent = error.code + ': ' + error.message;
        loginError.classList.remove('hidden');
    } finally {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// --- EVENTS LOGIC ---
const eventsCol = collection(db, 'events');
const addEventForm = document.getElementById('add-event-form');
const eventsList = document.getElementById('events-list');

addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = addEventForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Uploading...'; submitBtn.disabled = true;
    try {
        const imageURL = await getImageURL('ev-image-file', 'ev-image');
        
        await addDoc(eventsCol, {
            title: document.getElementById('ev-title').value,
            date: document.getElementById('ev-date').value,
            location: document.getElementById('ev-location').value,
            image: imageURL,
            link: document.getElementById('ev-link').value,
            status: document.getElementById('ev-status').value,
            createdAt: serverTimestamp()
        });
        addEventForm.reset();
        document.getElementById('ev-image-preview').classList.add('hidden');
        await loadEvents();
    } catch (error) {
        alert("Error adding event: " + error.message);
    } finally {
        submitBtn.textContent = 'Add Event'; submitBtn.disabled = false;
    }
});

async function loadEvents() {
    eventsList.innerHTML = '<p class="text-white/50 text-center py-8">Loading...</p>';
    try {
        const q = query(eventsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { eventsList.innerHTML = '<p class="text-white/50 py-8">No events.</p>'; return; }
        eventsList.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'bg-black/30 border border-white/10 p-4 rounded-lg flex justify-between items-center gap-4';
            
            const statusBadge = data.status === 'done' ? 'bg-white/20 text-white/70' : 'bg-secondary/20 text-secondary';
            
            let thumbHtml = '';
            if (data.image) {
                thumbHtml = '<img src="' + data.image + '" class="w-10 h-10 rounded object-cover border border-white/10 mr-3" />';
            }
            
            card.innerHTML = '<div class="flex items-center">' +
                thumbHtml +
                '<div>' +
                '<h4 class="text-white font-bold">' + data.title + '</h4>' +
                '<p class="text-white/60 text-sm">' + data.date + '</p>' +
                '</div></div>' +
                '<div class="flex items-center gap-2">' +
                '<span class="px-2 py-1 text-xs uppercase rounded ' + statusBadge + '">' + data.status + '</span>' +
                '<button class="toggle-status-btn text-xs bg-primary/20 text-primary px-2 py-1 rounded" data-id="' + docSnap.id + '" data-current="' + data.status + '">Toggle</button>' +
                '<button class="delete-btn text-error" data-id="' + docSnap.id + '" data-col="events"><span class="material-symbols-outlined text-sm">delete</span></button>' +
                '</div>';
            eventsList.appendChild(card);
        });
        attachListListeners();
    } catch (e) { eventsList.innerHTML = '<p class="text-error py-8">Error: ' + e.message + '</p>'; }
}

// --- PROJECTS LOGIC ---
const projectsCol = collection(db, 'projects');
const addProjectForm = document.getElementById('add-project-form');
const projectsList = document.getElementById('projects-list');

addProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = addProjectForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Uploading...'; submitBtn.disabled = true;
    try {
        const imageURL = await getImageURL('proj-image-file', 'proj-image');
        
        await addDoc(projectsCol, {
            title: document.getElementById('proj-title').value,
            description: document.getElementById('proj-desc').value,
            techStack: document.getElementById('proj-tech').value,
            image: imageURL,
            github: document.getElementById('proj-github').value,
            demo: document.getElementById('proj-demo').value,
            createdAt: serverTimestamp()
        });
        addProjectForm.reset();
        document.getElementById('proj-image-preview').classList.add('hidden');
        await loadProjects();
    } catch (error) {
        alert("Error adding project: " + error.message);
    } finally {
        submitBtn.textContent = 'Add Project'; submitBtn.disabled = false;
    }
});

async function loadProjects() {
    projectsList.innerHTML = '<p class="text-white/50 text-center py-8">Loading...</p>';
    try {
        const q = query(projectsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { projectsList.innerHTML = '<p class="text-white/50 py-8">No projects.</p>'; return; }
        projectsList.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'bg-black/30 border border-white/10 p-4 rounded-lg flex justify-between items-center gap-4';
            
            let thumbHtml = '';
            if (data.image) {
                thumbHtml = '<img src="' + data.image + '" class="w-10 h-10 rounded object-cover border border-white/10 mr-3" />';
            }
            
            card.innerHTML = '<div class="flex items-center">' +
                thumbHtml +
                '<div>' +
                '<h4 class="text-white font-bold">' + data.title + '</h4>' +
                '<p class="text-white/60 text-xs truncate max-w-[200px]">' + data.techStack + '</p>' +
                '</div></div>' +
                '<button class="delete-btn text-error" data-id="' + docSnap.id + '" data-col="projects"><span class="material-symbols-outlined text-sm">delete</span></button>';
            projectsList.appendChild(card);
        });
        attachListListeners();
    } catch (e) { projectsList.innerHTML = '<p class="text-error py-8">Error: ' + e.message + '</p>'; }
}

// --- TEAM LOGIC ---
const teamCol = collection(db, 'team');
const addTeamForm = document.getElementById('add-team-form');
const teamList = document.getElementById('team-list');

addTeamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = addTeamForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Uploading...'; submitBtn.disabled = true;
    try {
        const imageURL = await getImageURL('tm-image-file', 'tm-image');
        
        await addDoc(teamCol, {
            name: document.getElementById('tm-name').value,
            role: document.getElementById('tm-role').value,
            image: imageURL,
            linkedin: document.getElementById('tm-linkedin').value,
            github: document.getElementById('tm-github').value,
            createdAt: serverTimestamp()
        });
        addTeamForm.reset();
        document.getElementById('tm-image-preview').classList.add('hidden');
        await loadTeam();
    } catch (error) {
        alert("Error adding team member: " + error.message);
    } finally {
        submitBtn.textContent = 'Add Member'; submitBtn.disabled = false;
    }
});

async function loadTeam() {
    teamList.innerHTML = '<p class="text-white/50 text-center py-8">Loading...</p>';
    try {
        const q = query(teamCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { teamList.innerHTML = '<p class="text-white/50 py-8">No team members.</p>'; return; }
        teamList.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const card = document.createElement('div');
            card.className = 'bg-black/30 border border-white/10 p-4 rounded-lg flex justify-between items-center gap-4';
            
            let thumbHtml = '';
            if (data.image) {
                thumbHtml = '<img src="' + data.image + '" class="w-10 h-10 rounded-full object-cover border border-white/10 mr-3" />';
            }
            
            card.innerHTML = '<div class="flex items-center">' +
                thumbHtml +
                '<div>' +
                '<h4 class="text-white font-bold">' + data.name + '</h4>' +
                '<p class="text-white/60 text-xs">' + data.role + '</p>' +
                '</div></div>' +
                '<button class="delete-btn text-error" data-id="' + docSnap.id + '" data-col="team"><span class="material-symbols-outlined text-sm">delete</span></button>';
            teamList.appendChild(card);
        });
        attachListListeners();
    } catch (e) { teamList.innerHTML = '<p class="text-error py-8">Error: ' + e.message + '</p>'; }
}

// --- HOME SETTINGS LOGIC ---
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
    } catch (e) { console.error("Error loading home settings", e); }
}

homeSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = homeSettingsForm.querySelector('button');
    submitBtn.textContent = 'Saving...'; submitBtn.disabled = true;
    try {
        await setDoc(settingsDocRef, {
            hackathon: document.getElementById('hs-hackathon').value,
            projectsCount: document.getElementById('hs-projects').value,
            membersCount: document.getElementById('hs-members').value,
            meetup: document.getElementById('hs-meetup').value,
            updatedAt: serverTimestamp()
        }, { merge: true });
        
        const successMsg = document.getElementById('hs-success');
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 3000);
    } catch (error) {
        alert("Error saving settings: " + error.message);
    } finally {
        submitBtn.textContent = 'Save Settings'; submitBtn.disabled = false;
    }
});

// --- HELPER: DELETE & TOGGLE ---
function attachListListeners() {
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = e.target.getAttribute('data-id');
            const current = e.target.getAttribute('data-current');
            const newStatus = current === 'upcoming' ? 'done' : 'upcoming';
            e.target.disabled = true;
            await updateDoc(doc(db, 'events', id), { status: newStatus });
            loadEvents();
        };
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            if(confirm("Are you sure you want to delete this item?")) {
                const id = e.currentTarget.getAttribute('data-id');
                const collectionName = e.currentTarget.getAttribute('data-col');
                await deleteDoc(doc(db, collectionName, id));
                if (collectionName === 'events') loadEvents();
                if (collectionName === 'projects') loadProjects();
                if (collectionName === 'team') loadTeam();
            }
        };
    });
}
