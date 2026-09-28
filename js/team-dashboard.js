import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(async () => {
    const grid = document.getElementById('team-dashboard-grid');
    if (!grid) return;

    try {
        const q = query(collection(db, 'team'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        
        grid.innerHTML = '';

        if (snapshot.empty) {
            grid.innerHTML = '<p class="text-slate-500 text-center col-span-full py-12">No team members found.</p>';
            return;
        }

        const leadershipNames = ["anish mogam", "madhura lakade", "shreyas atre", "shreyas gore", "isha joshi", "mihir mendake"];
        let count = 0;

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const nameLower = (data.name || '').trim().toLowerCase();
            
            // SKIP leadership members
            if (leadershipNames.includes(nameLower)) return;
            if (nameLower.includes('bhagyashr') && nameLower.includes('lokhande')) return;
            count++;

            const role = data.role || 'Member';
            let imgSrc = data.image ? data.image : 'assets/images/sphere-logo.png';
            if (imgSrc.startsWith('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj')) {
                imgSrc = 'assets/images/sphere-logo.png';
            }
            const githubLink = data.github ? `<a href="${data.github}" target="_blank" class="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors" title="GitHub"><span class="material-symbols-outlined text-[16px]">code</span></a>` : '';
            const linkedinLink = data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors" title="LinkedIn"><span class="material-symbols-outlined text-[16px]">forum</span></a>` : '';

            const el = document.createElement('div');
            el.className = 'member-card p-5 rounded-xl bg-white border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between';
            el.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="w-20 h-20 rounded-full overflow-hidden p-0.5 bg-white border-2 border-blue-600 shadow-sm shrink-0">
                        <img alt="${data.name}" class="w-full h-full object-cover rounded-full" src="${imgSrc}"/>
                    </div>
                    <div class="flex-1">
                        <span class="font-label-caps text-[11px] font-bold text-blue-700 uppercase tracking-wider block">${role}</span>
                        <h3 class="font-headline-sm text-xl font-extrabold text-slate-950 uppercase tracking-tight">${data.name}</h3>
                        <div class="mt-2 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span class="font-telemetry-code text-xs font-bold text-slate-800">Active Node</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-200">
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="flex items-center gap-2">
                            ${githubLink}
                            ${linkedinLink}
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(el);
        });

        if (count === 0) {
            grid.innerHTML = '<p class="text-slate-500 text-center col-span-full py-12">No non-leadership members found.</p>';
        }

    } catch (error) {
        console.error("Error fetching team:", error);
        grid.innerHTML = '<p class="text-red-500 text-center col-span-full py-12">Failed to load team.</p>';
    }
})();
