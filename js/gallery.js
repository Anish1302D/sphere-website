/**
 * ================================================================
 * SPHERE COMMUNITY — EVENT GALLERY CLIENT LOGIC
 * Dynamic Firestore loading, multi-tier filtering, search,
 * and immersive keyboard-accessible Lightbox viewer
 * ================================================================
 */

import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Curated default high-res photographs for instant initial loading
const DEFAULT_GALLERY_PHOTOS = [
    {
        id: 'sample-1',
        title: "SphereHacks '25 — 36-Hour National Sprint",
        eventName: "SphereHacks 2025",
        category: "hackathons",
        date: "November 2025",
        description: "Over 400 builders gathered under stadium floodlights pushing production code through the night at our flagship collegiate hackathon.",
        image: "assets/images/gallery-hackathon-night.jpg",
        isSample: true
    },
    {
        id: 'sample-2',
        title: "Global AI Summit — Machine Learning Keynote",
        eventName: "Sphere AI Summit 2025",
        category: "workshops",
        date: "December 2025",
        description: "Deep-dive technical workshop on transformer architectures and distributed GPU inference held in the main conference hall.",
        image: "assets/images/gallery-workshop-stage.jpg",
        isSample: true
    },
    {
        id: 'sample-3',
        title: "Sphere Grand Finale Champions & $25K Bounties",
        eventName: "Innovatech Hackathon",
        category: "demodays",
        date: "January 2026",
        description: "The winning student engineering squad celebrates on stage after taking 1st place in the national prototype showcase.",
        image: "assets/images/gallery-awards-celebration.jpg",
        isSample: true
    },
    {
        id: 'sample-4',
        title: "Robotics & Embedded Systems Hackerspace Sprint",
        eventName: "Hardware Lab Sprint '26",
        category: "hardware",
        date: "February 2026",
        description: "Prototyping quadrupeds, custom microcontrollers, and sensor arrays in the campus makerspace laboratory.",
        image: "assets/images/gallery-hardware-lab.jpg",
        isSample: true
    }
];

// State
let allPhotos = [];
let filteredPhotos = [];
let currentLightboxIndex = -1;
let selectedCategory = 'all';
let selectedEvent = 'all';
let searchQuery = '';

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const emptyState = document.getElementById('gallery-empty-state');
const counterStat = document.getElementById('gallery-counter-stat');
const categoryButtons = document.querySelectorAll('.gallery-cat-btn');
const eventFilterSelect = document.getElementById('gallery-event-filter');
const searchInput = document.getElementById('gallery-search-input');
const resetBtn = document.getElementById('gallery-reset-filters');

// Lightbox Elements
const lightbox = document.getElementById('gallery-lightbox');
const lightboxCard = document.getElementById('lightbox-card');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxEventTag = document.getElementById('lightbox-event-tag');
const lightboxCatTag = document.getElementById('lightbox-cat-tag');
const lightboxDate = document.getElementById('lightbox-date');
const lightboxDesc = document.getElementById('lightbox-desc');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
const lightboxNextBtn = document.getElementById('lightbox-next-btn');

function escapeHTML(str) {
    return (str || '').toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function normalizeCategory(cat) {
    if (!cat) return 'community';
    const c = cat.toLowerCase().trim();
    if (c.startsWith('hack')) return 'hackathons';
    if (c.startsWith('work') || c.startsWith('sprint')) return 'workshops';
    if (c.startsWith('demo') || c.startsWith('pitch')) return 'demodays';
    if (c.startsWith('hard') || c.startsWith('lab') || c.startsWith('robot')) return 'hardware';
    if (c.startsWith('comm') || c.startsWith('meet') || c.startsWith('social')) return 'community';
    return c;
}

function getCategoryDisplayName(cat) {
    const norm = normalizeCategory(cat);
    switch (norm) {
        case 'hackathons': return 'Hackathon';
        case 'workshops': return 'Workshop';
        case 'demodays': return 'Demo Day';
        case 'hardware': return 'Hardware Lab';
        case 'community': return 'Community';
        default: return 'Event';
    }
}

// Fetch photos from Firestore
async function fetchGalleryPhotos() {
    try {
        const galleryCol = collection(db, 'gallery');
        const q = query(galleryCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const firestorePhotos = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            firestorePhotos.push({
                id: docSnap.id,
                title: data.title || 'Untitled Photo',
                eventName: data.eventName || data.event || 'Sphere Event',
                category: normalizeCategory(data.category),
                date: data.date || '2026',
                description: data.description || '',
                image: data.image || '',
                isFeatured: !!data.isFeatured
            });
        });

        // Merge: Firestore uploads come first, supplemented by curated defaults if list is small
        if (firestorePhotos.length > 0) {
            // Keep default samples that don't duplicate any firestore titles
            const existingTitles = new Set(firestorePhotos.map(p => p.title.toLowerCase()));
            const complementarySamples = DEFAULT_GALLERY_PHOTOS.filter(s => !existingTitles.has(s.title.toLowerCase()));
            allPhotos = [...firestorePhotos, ...complementarySamples];
        } else {
            allPhotos = [...DEFAULT_GALLERY_PHOTOS];
        }

        populateEventDropdown();
        applyFilters();

    } catch (error) {
        console.warn("Could not fetch gallery from Firestore, falling back to local archive:", error);
        allPhotos = [...DEFAULT_GALLERY_PHOTOS];
        populateEventDropdown();
        applyFilters();
    }
}

// Populate Event dropdown from loaded items
function populateEventDropdown() {
    if (!eventFilterSelect) return;

    const eventsSet = new Set();
    allPhotos.forEach(p => {
        if (p.eventName && p.eventName.trim()) {
            eventsSet.add(p.eventName.trim());
        }
    });

    const currentVal = eventFilterSelect.value;
    eventFilterSelect.innerHTML = '<option value="all">All Events</option>';

    Array.from(eventsSet).sort().forEach(evtName => {
        const opt = document.createElement('option');
        opt.value = evtName;
        opt.textContent = evtName;
        eventFilterSelect.appendChild(opt);
    });

    if (eventsSet.has(currentVal)) {
        eventFilterSelect.value = currentVal;
    }
}

// Apply Category, Event, and Search Filters
function applyFilters() {
    filteredPhotos = allPhotos.filter(photo => {
        // Category check
        if (selectedCategory !== 'all') {
            const photoCat = normalizeCategory(photo.category);
            if (photoCat !== selectedCategory) return false;
        }

        // Event check
        if (selectedEvent !== 'all') {
            if ((photo.eventName || '').trim() !== selectedEvent) return false;
        }

        // Search check
        if (searchQuery) {
            const haystack = `${photo.title} ${photo.eventName} ${photo.description} ${photo.category}`.toLowerCase();
            if (!haystack.includes(searchQuery)) return false;
        }

        return true;
    });

    renderGallery();
}

// Render Gallery Cards
function renderGallery() {
    if (!galleryGrid) return;

    if (counterStat) {
        counterStat.textContent = `${allPhotos.length} Captured`;
    }

    if (filteredPhotos.length === 0) {
        galleryGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    galleryGrid.innerHTML = '';

    filteredPhotos.forEach((photo, index) => {
        const card = document.createElement('div');
        card.className = 'group relative rounded-2xl overflow-hidden bg-surface-container-lowest border border-surface-container hover:border-secondary/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer';
        card.setAttribute('data-index', index);

        const safeImg = escapeHTML(photo.image || 'assets/images/sphere-logo.png');
        const safeTitle = escapeHTML(photo.title);
        const safeEvent = escapeHTML(photo.eventName || 'Sphere Event');
        const safeDate = escapeHTML(photo.date || '2026');
        const catBadge = getCategoryDisplayName(photo.category);

        card.innerHTML = `
            <div class="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
                <img src="${safeImg}" alt="${safeTitle}" loading="lazy"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                
                <!-- Atmospheric hover gradient -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                
                <!-- Category badge top left -->
                <div class="absolute top-3 left-3 flex items-center gap-1.5">
                    <span class="px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-caps text-[10px] uppercase font-bold tracking-wider shadow-sm">
                        ${catBadge}
                    </span>
                    ${photo.isFeatured ? `
                    <span class="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-caps text-[9px] uppercase font-bold">
                        FEATURED
                    </span>` : ''}
                </div>

                <!-- Date badge top right -->
                <div class="absolute top-3 right-3">
                    <span class="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 font-telemetry-code text-[10px] tracking-wider font-semibold">
                        ${safeDate}
                    </span>
                </div>

                <!-- Hover Zoom Prompt -->
                <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div class="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg">
                        <span class="material-symbols-outlined text-[18px]">zoom_in</span>
                    </div>
                </div>

                <!-- Event Name Tag bottom left -->
                <div class="absolute bottom-3 left-3 text-white max-w-[80%] truncate">
                    <div class="flex items-center gap-1.5 text-secondary-200 font-telemetry-code text-xs font-semibold">
                        <span class="material-symbols-outlined text-[14px]">event</span>
                        <span class="truncate">${safeEvent}</span>
                    </div>
                </div>
            </div>

            <!-- Card Body -->
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-headline-sm text-base font-bold text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                        ${safeTitle}
                    </h3>
                    ${photo.description ? `
                    <p class="font-body-sm text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                        ${escapeHTML(photo.description)}
                    </p>` : ''}
                </div>

                <div class="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span class="font-telemetry-code text-[11px] uppercase tracking-wider text-secondary flex items-center gap-1">
                        <span>VIEW PHOTOGRAPH</span>
                        <span class="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant/40">fullscreen</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => openLightbox(index));
        galleryGrid.appendChild(card);
    });
}

// Lightbox Open & Navigation
function openLightbox(index) {
    if (index < 0 || index >= filteredPhotos.length) return;
    currentLightboxIndex = index;
    const photo = filteredPhotos[currentLightboxIndex];

    lightboxImg.src = photo.image || 'assets/images/sphere-logo.png';
    lightboxImg.alt = photo.title || 'Event Photograph';
    lightboxTitle.textContent = photo.title || 'Untitled Photo';
    lightboxEventTag.textContent = photo.eventName || 'Sphere Event';
    lightboxCatTag.textContent = getCategoryDisplayName(photo.category);
    lightboxDate.textContent = photo.date || '2026';
    lightboxDesc.textContent = photo.description || 'Sphere Community archive photograph.';
    
    lightboxCounter.textContent = `Photo ${currentLightboxIndex + 1} of ${filteredPhotos.length}`;
    lightboxDownloadBtn.href = photo.image || '#';

    // Show modal
    lightbox.classList.remove('opacity-0', 'pointer-events-none');
    if (lightboxCard) lightboxCard.classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    currentLightboxIndex = -1;
    lightbox.classList.add('opacity-0', 'pointer-events-none');
    if (lightboxCard) lightboxCard.classList.add('scale-95');
    document.body.style.overflow = '';
}

function prevLightbox() {
    if (filteredPhotos.length === 0) return;
    let nextIndex = currentLightboxIndex - 1;
    if (nextIndex < 0) nextIndex = filteredPhotos.length - 1;
    openLightbox(nextIndex);
}

function nextLightbox() {
    if (filteredPhotos.length === 0) return;
    let nextIndex = currentLightboxIndex + 1;
    if (nextIndex >= filteredPhotos.length) nextIndex = 0;
    openLightbox(nextIndex);
}

// Wire Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchGalleryPhotos();

    // Category button filters
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => {
                b.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
                b.classList.add('text-on-surface-variant');
            });
            btn.classList.add('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
            btn.classList.remove('text-on-surface-variant');

            selectedCategory = btn.getAttribute('data-category') || 'all';
            applyFilters();
        });
    });

    // Event dropdown filter
    if (eventFilterSelect) {
        eventFilterSelect.addEventListener('change', (e) => {
            selectedEvent = e.target.value;
            applyFilters();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            selectedCategory = 'all';
            selectedEvent = 'all';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            if (eventFilterSelect) eventFilterSelect.value = 'all';
            categoryButtons.forEach(b => {
                if (b.getAttribute('data-category') === 'all') {
                    b.classList.add('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
                    b.classList.remove('text-on-surface-variant');
                } else {
                    b.classList.remove('active', 'bg-secondary-container', 'text-on-secondary-container', 'shadow-sm');
                    b.classList.add('text-on-surface-variant');
                }
            });
            applyFilters();
        });
    }

    // Lightbox Controls
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', prevLightbox);
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', nextLightbox);

    // Close on outside backdrop click
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox || lightbox.classList.contains('pointer-events-none')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevLightbox();
        if (e.key === 'ArrowRight') nextLightbox();
    });
});
