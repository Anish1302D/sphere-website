import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Global filter function required by Stitch Events UI
window.filterEvents = function(category, buttonEl) {
    // Update active tab buttons styling
    const buttons = document.querySelectorAll('.event-filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');
        btn.classList.add('text-on-surface-variant');
    });
    buttonEl.classList.remove('text-on-surface-variant');
    buttonEl.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm');

    // Filter cards
    const cards = document.querySelectorAll('.event-card');
    cards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'flex';
        } else {
            const cardCategory = card.getAttribute('data-category');
            if (cardCategory === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        }
    });
};

const escapeHTML = (str) => {
    return (str || '').toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

document.addEventListener('DOMContentLoaded', async () => {
    const eventsGrid = document.getElementById('dynamic-events-grid');
    if (!eventsGrid) return;

    try {
        const eventsCol = collection(db, 'events');
        const q = query(eventsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            eventsGrid.innerHTML = '<p class="text-on-surface-variant text-center col-span-full py-12">No upcoming events found. Check back later!</p>';
            return;
        }

        eventsGrid.innerHTML = '';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const el = document.createElement('div');
            
            const isDone = data.status === 'done';
            
            el.className = 'event-card group bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between';
            const category = data.category ? data.category.toLowerCase() : 'all';
            el.setAttribute('data-category', escapeHTML(category));
            
            let imgHtml = '';
            if (data.image) {
                // Ensure URL itself doesn't contain bad chars (URL encoding would be better, but basic escape helps)
                const safeImg = data.image.replace(/"/g, '&quot;');
                imgHtml = `
                <div class="w-full h-40 mb-6 rounded-xl overflow-hidden relative">
                    <img src="${safeImg}" alt="${escapeHTML(data.title)}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                </div>`;
            }

            el.innerHTML = `
                <div class="flex flex-col gap-4">
                    ${imgHtml}
                    <div class="flex items-center justify-between">
                        <span class="px-3 py-1 rounded-full ${isDone ? 'bg-surface-container-high' : 'bg-surface-container'} ${isDone ? 'text-on-surface' : 'text-secondary'} font-label-caps text-label-caps">
                          ${escapeHTML(data.status ? data.status.toUpperCase() : 'EVENT')}
                        </span>
                        <span class="font-telemetry-code text-telemetry-code text-on-surface-variant">DURATION N/A</span>
                    </div>
                    <div class="flex flex-col gap-2">
                        <span class="font-telemetry-code text-telemetry-code text-on-surface-variant">${escapeHTML(data.date || 'TBA')}</span>
                        <h4 class="font-headline-md text-headline-md text-on-surface group-hover:text-secondary transition-colors">
                          ${escapeHTML(data.title)}
                        </h4>
                        ${data.description ? `<p class="font-body-md text-body-md text-on-surface-variant line-clamp-3">${escapeHTML(data.description)}</p>` : ''}
                    </div>
                </div>
                <div class="pt-6 mt-6 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            ${data.location ? `
                            <div class="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-label-caps text-label-caps font-bold">
                                LOC
                            </div>
                            <span class="font-body-sm text-body-sm text-on-surface font-medium">${escapeHTML(data.location)}</span>
                            ` : ''}
                        </div>
                    </div>
                    ${data.link ? `
                    <div class="flex items-center gap-3">
                        <a href="${data.link.replace(/"/g, '&quot;')}" target="_blank" class="w-full py-2.5 rounded-lg ${isDone ? 'bg-surface-container-low text-on-surface hover:bg-surface-container-high' : 'bg-secondary-container text-on-secondary hover:bg-secondary'} font-title-caps text-title-caps transition-all text-center block">
                          ${isDone ? 'VIEW DETAILS' : 'REGISTER NOW'}
                        </a>
                    </div>
                    ` : ''}
                </div>
            `;
            eventsGrid.appendChild(el);
        });

    } catch (error) {
        console.error("Error fetching events:", error);
        eventsGrid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load events. Please try again later.</p>';
    }
});
