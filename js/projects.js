import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

function normalizeProjCategory(cat) {
    if (!cat) return 'all';
    const c = cat.toLowerCase().trim();
    if (c === 'all') return 'all';
    if (c.includes('distribut') || c.includes('web')) return 'distributed';
    if (c.includes('ai') || c.includes('deep') || c.includes('learn') || c.includes('ml')) return 'ai';
    if (c.includes('secur') || c.includes('cyber')) return 'cybersecurity';
    if (c.includes('cloud') || c.includes('devops')) return 'cloud';
    if (c.includes('spatial') || c.includes('ui') || c.includes('design') || c.includes('ux')) return 'spatial';
    return c;
}

// Global filter function required by Stitch Events UI
window.filterProjects = function(category, buttonEl) {
    // Update active tab buttons styling
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-primary', 'text-on-primary');
        btn.classList.add('bg-surface-container-lowest', 'text-on-surface-variant');
    });
    buttonEl.classList.remove('bg-surface-container-lowest', 'text-on-surface-variant');
    buttonEl.classList.add('bg-primary', 'text-on-primary');

    const target = normalizeProjCategory(category);

    // Filter cards
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        if (target === 'all') {
            card.style.display = 'flex';
        } else {
            const cardCategory = normalizeProjCategory(card.getAttribute('data-category'));
            if (cardCategory === target) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    // Setup filter button listeners (calling global function)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const category = button.getAttribute('data-category');
            window.filterProjects(category, button);
        });
    });

    const grid = document.getElementById('dynamic-projects-grid');
    const flagshipContainer = document.getElementById('flagship-spotlight-container');
    if (!grid) return;

    try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            grid.innerHTML = '<p class="text-on-surface-variant text-center col-span-full py-12">No projects have been added yet.</p>';
            if (flagshipContainer) flagshipContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = '';
        
        const allProjects = [];
        snapshot.forEach(docSnap => {
            allProjects.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Determine designated Flagship project (or default to the first one)
        const flagshipIndex = allProjects.findIndex(p => p.isFlagship === true);
        const flagship = flagshipIndex !== -1 ? allProjects.splice(flagshipIndex, 1)[0] : allProjects.shift();

        if (flagship && flagshipContainer) {
            const category = flagship.category ? flagship.category.toLowerCase() : 'all';
            const techStackArray = flagship.techStack ? flagship.techStack.split(',').map(t => t.trim()) : [];
            
            flagshipContainer.innerHTML = `
                <div class="relative bg-surface-container-lowest rounded-2xl p-6 lg:p-10 shadow-xl overflow-hidden mb-space-2xl">
                <div class="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <!-- Spotlight Details -->
                <div class="lg:col-span-5 flex flex-col gap-space-md order-2 lg:order-1">
                <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary font-label-caps text-label-caps tracking-widest uppercase shadow-sm">FLAGSHIP SPOTLIGHT</span>
                <span class="font-telemetry-code text-telemetry-code text-on-surface-variant">NODE // ${category.toUpperCase()}</span>
                </div>
                <div class="flex flex-col gap-2">
                <h2 class="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                    ${escapeHTML(flagship.title)}
                </h2>
                <p class="font-body-md text-body-md text-on-surface-variant">
                    ${flagship.description || ''}
                </p>
                </div>
                <!-- Architecture Spec Pills -->
                <div class="flex flex-wrap items-center gap-2">
                    ${techStackArray.map(tech => `<span class="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">${escapeHTML(tech)}</span>`).join('')}
                </div>
                <!-- Actions -->
                <div class="flex flex-wrap items-center gap-4 pt-2">
                ${flagship.demo ? `
                <a class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-container text-on-secondary hover:bg-secondary font-headline-sm text-headline-sm transition-all shadow-md hover:shadow-lg" href="${flagship.demo}" target="_blank">
                <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
                <span>Launch Live System</span>
                </a>` : ''}
                ${flagship.github ? `
                <a class="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container font-headline-sm text-headline-sm transition-colors" href="${flagship.github}" target="_blank">
                <span class="material-symbols-outlined text-[18px]">terminal</span>
                <span>Audit Repo</span>
                </a>` : ''}
                </div>
                </div>
                <!-- Spotlight Graphic -->
                <div class="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
                <div class="relative rounded-xl overflow-hidden bg-surface-container-highest shadow-xl aspect-video group flex items-center justify-center">
                    ${flagship.image ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" src="${flagship.image}" alt="${escapeHTML(flagship.title)}">` : `<span class="material-symbols-outlined text-[64px] text-on-surface-variant/20">code</span>`}
                <div class="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                <span class="font-telemetry-code text-telemetry-code text-on-surface">SYSTEM STATUS: OPTIMAL</span>
                </div>
                </div>
                </div>
                </div>
                </div>
            `;
        }

        // Render remaining projects into standard grid
        allProjects.forEach(data => {
            const category = data.category ? data.category.toLowerCase() : 'all';
            const techStackArray = data.techStack ? data.techStack.split(',').map(t => t.trim()) : [];
                    <!-- Architecture Spec Pills -->
                    <div class="flex flex-wrap items-center gap-2">
                        ${techStackArray.map(tech => `<span class="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">${tech}</span>`).join('')}
                    </div>
                    <!-- Actions -->
                    <div class="flex flex-wrap items-center gap-4 pt-2">
                    ${data.demo ? `
                    <a class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-container text-on-secondary hover:bg-secondary font-headline-sm text-headline-sm transition-all shadow-md hover:shadow-lg" href="${data.demo}" target="_blank">
                    <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
                    <span>Launch Live System</span>
                    </a>` : ''}
                    ${data.github ? `
                    <a class="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container font-headline-sm text-headline-sm transition-colors" href="${data.github}" target="_blank">
                    <span class="material-symbols-outlined text-[18px]">terminal</span>
                    <span>Audit Repo</span>
                    </a>` : ''}
                    </div>
                    </div>
                    <!-- Spotlight Graphic -->
                    <div class="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
                    <div class="relative rounded-xl overflow-hidden bg-surface-container-highest shadow-xl aspect-video group flex items-center justify-center">
                        ${data.image ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" src="${data.image}" alt="${escapeHTML(data.title)}">` : `<span class="material-symbols-outlined text-[64px] text-on-surface-variant/20">code</span>`}
                    <div class="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                    <span class="font-telemetry-code text-telemetry-code text-on-surface">SYSTEM STATUS: OPTIMAL</span>
                    </div>
                    </div>
                    </div>
                    </div>
                    </div>
                `;
            } else {
                // Render Standard Grid Project
                const el = document.createElement('div');
                el.className = 'project-card flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group';
                el.setAttribute('data-category', category);
                
                const imgHtml = data.image ? `<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${data.image}" alt="${escapeHTML(data.title)}">` : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-[48px] text-on-surface-variant/20">code</span></div>`;
                const displayCategory = category !== 'all' ? category.toUpperCase() : 'PROJECT';
                const status = data.status || 'ACTIVE';

                el.innerHTML = `
                    <div class="relative h-48 bg-surface-container-high overflow-hidden">
                        ${imgHtml}
                        <div class="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full text-secondary font-label-caps text-label-caps flex items-center gap-1 shadow-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                            <span>${status}</span>
                        </div>
                        <div class="absolute bottom-3 left-3 bg-primary/80 backdrop-blur-md px-2.5 py-0.5 rounded text-on-primary font-telemetry-code text-telemetry-code">
                            ${displayCategory}
                        </div>
                    </div>
                    <div class="p-space-lg flex flex-col flex-grow justify-between gap-space-md">
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                                <h4 class="font-headline-md text-headline-md text-on-surface font-semibold group-hover:text-secondary-container transition-colors">${escapeHTML(data.title)}</h4>
                                ${(data.demo || data.github) ? `<a class="text-on-surface-variant hover:text-secondary" href="${data.demo || data.github}" target="_blank"><span class="material-symbols-outlined text-[20px]">north_east</span></a>` : ''}
                            </div>
                            <p class="font-body-md text-body-md text-on-surface-variant">
                                ${data.description || ''}
                            </p>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="flex flex-wrap gap-1.5">
                                ${techStackArray.map(tech => `<span class="font-telemetry-code text-telemetry-code px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant">${tech}</span>`).join('')}
                            </div>
                            <div class="flex items-center justify-between pt-2">
                                <span class="font-telemetry-code text-telemetry-code text-secondary">v1.0.0 // DEPLOYED</span>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(el);
            }
        });

        // Trigger filter to handle current selection if needed (defaults to 'all' in UI)
    } catch (error) {
        console.error("Error fetching projects:", error);
        grid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load projects.</p>';
    }
});
