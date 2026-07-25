import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const eventsGrid = document.getElementById('dynamic-events-grid');
    if (!eventsGrid) return;

    try {
        const eventsCol = collection(db, 'events');
        const q = query(eventsCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            eventsGrid.innerHTML = '<p class="text-white/50 text-center col-span-full py-12">No upcoming events found. Check back later!</p>';
            return;
        }

        eventsGrid.innerHTML = '';
        
        let i = 0;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const el = document.createElement('div');
            
            // Alternate border colors based on index for styling
            const borderColor = i % 2 === 0 ? 'border-t-primary/30' : 'border-t-secondary/30';
            const shadowColor = i % 2 === 0 ? 'hover:shadow-[0_10px_30px_rgba(0,207,255,0.1)]' : 'hover:shadow-[0_10px_30px_rgba(116,246,49,0.1)]';
            const btnClass = i % 2 === 0 ? 'border-primary/50 text-primary hover:bg-primary/10' : 'border-secondary/50 text-secondary hover:bg-secondary/10';
            const badgeClass = data.status === 'done' ? 'bg-white/10 text-white/50 border-white/20' : (i % 2 === 0 ? 'bg-primary/20 text-primary border-primary/50' : 'bg-secondary/20 text-secondary border-secondary/50');
            
            el.className = `glass-panel p-6 rounded-xl border-t ${borderColor} hover:-translate-y-2 transition-all duration-300 flex flex-col shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${shadowColor}`;
            
            let imgHtml = '';
            if (data.image) {
                imgHtml = `<div class="w-full h-32 mb-4 rounded-lg overflow-hidden relative">
                    <img src="${data.image}" alt="${data.title}" class="absolute inset-0 w-full h-full object-cover">
                </div>`;
            }

            el.innerHTML = `
                ${imgHtml}
                <div class="flex justify-between items-start mb-2 gap-2">
                    <h3 class="text-xl font-bold text-white leading-tight">${data.title}</h3>
                    <span class="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${badgeClass}">${data.status}</span>
                </div>
                <div class="space-y-2 text-xs text-white/80 mb-6 flex-1 mt-2">
                    <div class="flex justify-between border-b border-white/10 pb-1">
                        <span class="text-white/50">Date</span>
                        <span class="font-medium text-right">${data.date}</span>
                    </div>
                    ${data.location ? `
                    <div class="flex justify-between border-b border-white/10 pb-1">
                        <span class="text-white/50">Location</span>
                        <span class="font-medium text-right">${data.location}</span>
                    </div>
                    ` : ''}
                </div>
                ${data.link ? `
                <a href="${data.link}" target="_blank" class="block text-center w-full py-2 rounded border ${btnClass} transition-colors font-bold tracking-wide text-sm mt-auto">
                    ${data.status === 'done' ? 'View Details' : 'Register Now'}
                </a>
                ` : ''}
            `;
            eventsGrid.appendChild(el);
            i++;
        });

    } catch (error) {
        console.error("Error fetching events:", error);
        eventsGrid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load events. Please try again later.</p>';
    }
});
