import { db } from './firebase-config.js';
import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

(async () => {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid) return;

    try {
        teamGrid.innerHTML = '<p class="text-on-surface-variant text-center col-span-full py-12">Loading roster...</p>';
        const q = query(collection(db, 'team'));
        const snapshot = await getDocs(q);

        teamGrid.innerHTML = '';

        if (snapshot.empty) {
            teamGrid.innerHTML = '<p class="text-on-surface-variant text-center col-span-full py-12">No team members have been added yet.</p>';
            return;
        }

        const exactOrder = [
            "anish mogam",
            "madhura lakade",
            "shreyash atre",
            "shreyas gore",
            "isha joshi",
            "mihir mendake",
            "siddheshwar hinge",
            "vaibhav bandgar",
            "om shinde",
            "ayush teli"
        ];
        
        const localImages = {
            "anish mogam": "anish.jpg",
            "madhura lakade": "madhura.jpg",
            "shreyash atre": "shreyash.jpg",
            "shreyas gore": "shreyasgore.jpg",
            "isha joshi": "isha.jpg",
            "mihir mendake": "mihir.jpg",
            "ayush teli": "ayush.jpg",
            "siddheshwar hinge": "siddheshwar.jpg",
            "vaibhav bandgar": "vaibhav.jpg",
            "om shinde": "sphere-logo.png"
        };

        let foundMembers = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const nameLower = (data.name || '').trim().toLowerCase();
            
            // Exclude Bhagyashree Lokhande
            if (nameLower === "bhagyashree lokhande") {
                return;
            }
            
            // Resolve spelling differences
            let resolvedNameLower = nameLower;
            if (resolvedNameLower.includes("mehendake")) {
                resolvedNameLower = resolvedNameLower.replace("mehendake", "mendake");
            }
            if (resolvedNameLower === "shreyas atre") {
                resolvedNameLower = "shreyash atre";
            }
            
            foundMembers.push({
                data: data,
                resolvedNameLower: resolvedNameLower
            });
        });

        // Hardcode missing members as requested by user
        const missingHardcoded = [
            { 
                name: "Anish Mogam", 
                role: "Founder",
                order: 1,
                github: "https://github.com/Anish1302D",
                linkedin: "https://www.linkedin.com/in/anish-mogam/"
            },
            { 
                name: "Shreyash Atre", 
                role: "Co-Founder",
                order: 3,
                github: "https://github.com/shreyash0216",
                linkedin: "https://www.linkedin.com/in/shreyash-atre-901340317/"
            },
            { 
                name: "Isha Joshi", 
                role: "Administrator",
                order: 5,
                github: "https://github.com/ishaj306",
                linkedin: "https://www.linkedin.com/in/isha-joshi-4b1074319/"
            }
        ];

        missingHardcoded.forEach(missing => {
            const nameLower = missing.name.toLowerCase();
            if (!foundMembers.some(m => m.resolvedNameLower === nameLower)) {
                foundMembers.push({
                    data: missing,
                    resolvedNameLower: nameLower
                });
            }
        });

        // Deduplicate members by name to guarantee zero double entries
        const uniqueMembers = [];
        const seenNames = new Set();
        foundMembers.forEach(item => {
            if (!seenNames.has(item.resolvedNameLower)) {
                seenNames.add(item.resolvedNameLower);
                uniqueMembers.push(item);
            }
        });
        foundMembers = uniqueMembers;

        // Sort based on order field from admin panel or fallback to exactOrder
        foundMembers.sort((a, b) => {
            const hasOrderA = a.data && a.data.order !== undefined && a.data.order !== null && !isNaN(Number(a.data.order));
            const hasOrderB = b.data && b.data.order !== undefined && b.data.order !== null && !isNaN(Number(b.data.order));

            let valA = hasOrderA ? Number(a.data.order) : null;
            let valB = hasOrderB ? Number(b.data.order) : null;

            if (valA === null) {
                const idx = exactOrder.indexOf(a.resolvedNameLower);
                valA = idx !== -1 ? (idx + 1) : 999;
            }
            if (valB === null) {
                const idx = exactOrder.indexOf(b.resolvedNameLower);
                valB = idx !== -1 ? (idx + 1) : 999;
            }

            if (valA !== valB) {
                return valA - valB;
            }
            return (a.data.name || '').localeCompare(b.data.name || '');
        });

        foundMembers.forEach(item => {
            const data = item.data;
            const nameLower = item.resolvedNameLower;
            
            let role = data.role || 'Member';
            
            // Override Mihir's role manually
            if (nameLower === "mihir mendake" || nameLower === "mihir mehendake") {
                role = "Core Team Lead";
            }
            
            const localImgSrc = data.image && data.image.trim() 
                ? data.image.trim() 
                : (localImages[nameLower] ? `assets/images/${localImages[nameLower]}` : 'assets/images/sphere-logo.png');
            
            const githubUrl = (data.github || '').trim();
            const githubLink = githubUrl ? `<a href="${githubUrl}" target="_blank" class="w-8 h-8 rounded-md bg-surface-container-low border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-colors" title="GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>` : '';
            
            const linkedinUrl = (data.linkedin || '').trim();
            const linkedinLink = linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="w-8 h-8 rounded-md bg-surface-container-low border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-colors" title="LinkedIn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>` : '';

            const el = document.createElement('div');
            el.className = 'group member-card relative p-6 rounded-2xl bg-surface-container-lowest border border-outline shadow-sm hover:shadow-lg hover:border-secondary transition-all duration-300 flex flex-col justify-between';
            
            el.innerHTML = `
            <div class="relative flex flex-col items-center text-center">
                <div class="relative w-36 h-36 sm:w-44 sm:h-44 mb-6 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full border border-secondary/50 animate-[spin_30s_linear_infinite]"></div>
                    <div class="absolute -inset-1.5 rounded-full bg-secondary-container/10 blur-sm"></div>
                    <div class="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden p-1 bg-surface-container-lowest border border-secondary shadow-md relative z-10">
                        <img class="w-full h-full object-cover rounded-full" src="${localImgSrc}" alt="${escapeHTML(data.name)}" onerror="this.onerror=null; this.src='assets/images/sphere-logo.png'">
                    </div>
                </div>
                <span class="inline-block px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant text-secondary font-label-caps text-[11px] font-bold uppercase mb-2">
                    ${role}
                </span>
                <h3 class="font-headline-sm text-lg sm:text-xl font-extrabold text-on-surface uppercase tracking-tight">${escapeHTML(data.name)}</h3>
            </div>
            `;
            
            if (data.skills || data.interests) {
                const metaDiv = document.createElement('div');
                metaDiv.className = 'mt-4 pt-4 border-t border-outline-variant flex flex-col gap-2';
                
                if (data.skills) {
                    metaDiv.innerHTML += `
                    <div class="flex flex-col text-left">
                        <span class="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">Skills</span>
                        <span class="font-body-sm text-xs text-on-surface font-medium">${data.skills}</span>
                    </div>`;
                }
                if (data.interests) {
                    metaDiv.innerHTML += `
                    <div class="flex flex-col text-left">
                        <span class="font-label-caps text-[10px] text-on-surface-variant uppercase mb-1">Interests</span>
                        <span class="font-body-sm text-xs text-on-surface font-medium">${data.interests}</span>
                    </div>`;
                }
                
                el.appendChild(metaDiv);
            }
            
            const linksDiv = document.createElement('div');
            linksDiv.className = 'flex justify-center gap-2 mt-4 pt-4 border-t border-outline-variant';
            if (githubLink || linkedinLink) {
                linksDiv.innerHTML = `${githubLink}${linkedinLink}`;
                el.appendChild(linksDiv);
            }

            teamGrid.appendChild(el);
        });

    } catch (error) {
        console.error("Error fetching team:", error);
        teamGrid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load team.</p>';
    }
})();
