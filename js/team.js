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
                        ${data.github ? `<a href="${data.github}" target="_blank" class="text-white/50 hover:text-${colorClass} transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>` : ''}
                        ${data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="text-white/50 hover:text-${colorClass} transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>` : ''}
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
