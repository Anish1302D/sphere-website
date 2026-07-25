import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const docRef = doc(db, 'settings', 'home');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            const elHackathon = document.getElementById('stat-hackathon');
            const elProjects = document.getElementById('stat-projects');
            const elMembers = document.getElementById('stat-members');
            const elMeetup = document.getElementById('stat-meetup');
            
            if(elHackathon && data.hackathon) elHackathon.textContent = data.hackathon;
            if(elProjects && data.projectsCount) elProjects.textContent = data.projectsCount;
            if(elMembers && data.membersCount) elMembers.textContent = data.membersCount;
            if(elMeetup && data.meetup) elMeetup.textContent = data.meetup;
        }
    } catch (error) {
        console.error("Error fetching home stats:", error);
    }
});
