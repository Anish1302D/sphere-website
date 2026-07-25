import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('dynamic-projects-grid');
    if (!grid) return;

    try {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            grid.innerHTML = '<p class="text-white/50 text-center col-span-full py-12">No projects have been added yet.</p>';
            return;
        }

        grid.innerHTML = '';
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = 'glass-panel p-6 rounded-xl border-t border-t-primary/30 hover:-translate-y-2 transition-all duration-300 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_30px_rgba(0,207,255,0.1)]';
            
            let imgHtml = '';
            if (data.image) {
                imgHtml = `<div class="w-full h-40 mb-4 rounded-lg overflow-hidden relative">
                    <img src="${data.image}" alt="${data.title}" class="absolute inset-0 w-full h-full object-cover">
                </div>`;
            }

            el.innerHTML = `
                ${imgHtml}
                <h3 class="text-xl font-bold text-white mb-2">${data.title}</h3>
                <p class="text-sm text-on-surface-variant mb-4 flex-1">${data.description}</p>
                
                <div class="mb-6">
                    <h4 class="text-xs text-white/50 uppercase tracking-wider mb-2">Tech Stack</h4>
                    <div class="flex flex-wrap gap-2">
                        ${data.techStack.split(',').map(tech => `<span class="px-2 py-1 bg-white/5 text-white/80 text-xs rounded border border-white/10">${tech.trim()}</span>`).join('')}
                    </div>
                </div>

                <div class="flex gap-4 mt-auto border-t border-white/10 pt-4">
                    ${data.github ? `<a href="${data.github}" target="_blank" class="flex-1 text-center py-2 rounded bg-white/5 text-white hover:bg-white/10 transition-colors text-sm font-bold"><span class="material-symbols-outlined text-sm align-middle mr-1">code</span> GitHub</a>` : ''}
                    ${data.demo ? `<a href="${data.demo}" target="_blank" class="flex-1 text-center py-2 rounded bg-primary-container text-black hover:bg-primary transition-colors text-sm font-bold"><span class="material-symbols-outlined text-sm align-middle mr-1">open_in_new</span> Live Demo</a>` : ''}
                </div>
            `;
            grid.appendChild(el);
        });

    } catch (error) {
        console.error("Error fetching projects:", error);
        grid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load projects.</p>';
    }
});
