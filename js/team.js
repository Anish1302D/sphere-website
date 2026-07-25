import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('dynamic-team-grid');
    if (!grid) return;

    try {
        const q = query(collection(db, 'team'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            grid.innerHTML = '<p class="text-white/50 text-center col-span-full py-12">No team members have been added yet.</p>';
            return;
        }

        grid.innerHTML = '';
        
        let i = 0;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const el = document.createElement('div');
            
            const colorClass = i % 2 === 0 ? 'primary' : 'secondary';
            const hoverBorder = i % 2 === 0 ? 'hover:border-primary/50' : 'hover:border-secondary/50';
            const hoverShadow = i % 2 === 0 ? 'hover:shadow-[0_0_30px_rgba(0,207,255,0.2)]' : 'hover:shadow-[0_0_30px_rgba(116,246,49,0.2)]';
            const hoverText = i % 2 === 0 ? 'group-hover:text-primary' : 'group-hover:text-secondary';
            
            el.className = `glass-panel rounded-2xl overflow-hidden flex flex-col group border border-white/5 ${hoverBorder} transition-all duration-300 relative shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${hoverShadow}`;
            
            const imgSrc = data.image ? data.image : 'assets/images/default-pfp.jpg';
            
            el.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-b from-${colorClass}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
                <div class="h-64 w-full overflow-hidden relative">
                    <img src="${imgSrc}" alt="${data.name}" class="w-full h-full object-cover object-top grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105" />
                </div>
                <div class="p-6 text-center space-y-2 relative z-20 bg-[#05070a]/90 backdrop-blur-md border-t border-white/5">
                    <h3 class="text-xl font-bold text-white tracking-wide ${hoverText} transition-colors">${data.name}</h3>
                    <p class="text-xs text-${colorClass} uppercase tracking-widest font-label-sm">${data.role}</p>
                    <div class="flex justify-center gap-3 pt-2">
                        ${data.github ? `<a href="${data.github}" target="_blank" class="text-white/50 hover:text-${colorClass} transition-colors"><span class="material-symbols-outlined text-sm">code</span></a>` : ''}
                        ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="text-white/50 hover:text-${colorClass} transition-colors"><span class="material-symbols-outlined text-sm">share</span></a>` : ''}
                    </div>
                </div>
            `;
            grid.appendChild(el);
            i++;
        });

    } catch (error) {
        console.error("Error fetching team:", error);
        grid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load team.</p>';
    }
});
