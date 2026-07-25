document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('button.md\\:hidden');
    const navLinks = document.querySelector('.hidden.md\\:flex');
    const actionBtn = document.querySelector('.hidden.md\\:block');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('hidden');
            navLinks.classList.toggle('flex');
            navLinks.classList.toggle('flex-col');
            navLinks.classList.toggle('absolute');
            navLinks.classList.toggle('top-full');
            navLinks.classList.toggle('left-0');
            navLinks.classList.toggle('w-full');
            navLinks.classList.toggle('bg-surface');
            navLinks.classList.toggle('p-4');
            
            actionBtn.classList.toggle('hidden');
            actionBtn.classList.toggle('block');
            actionBtn.classList.toggle('absolute');
            actionBtn.classList.toggle('top-[100%]');
            actionBtn.classList.toggle('right-4');
            actionBtn.classList.toggle('mt-4');
        });
    }

    // Google Form Modal Logic
    const joinButtons = document.querySelectorAll('a[href="#join"], a[href="#register"]');
    if (joinButtons.length > 0) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4 md:p-8';
        modalOverlay.innerHTML = `
            <div class="relative w-full max-w-4xl h-[90vh] glass-panel rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,207,255,0.3)] transform scale-95 transition-transform duration-300 flex flex-col">
                <div class="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                    <h3 class="font-display text-xl text-white font-bold tracking-tight">Join Sphere Coding Club</h3>
                    <button class="modal-close text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="flex-1 w-full relative bg-white">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/10 z-0">
                        <span class="w-8 h-8 rounded-full bg-primary inline-block animate-pulse"></span>
                    </div>
                    <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfE64tcRic6_vQqcpif40T0oJbLrn1YLjwKidKTk8FzUGKTwg/viewform?embedded=true" class="absolute inset-0 w-full h-full z-10 border-0" marginheight="0" marginwidth="0">Loading...</iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        const modalContent = modalOverlay.querySelector('.glass-panel');
        const closeBtn = modalOverlay.querySelector('.modal-close');

        const openModal = (e) => {
            e.preventDefault();
            modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('scale-95');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        const closeModal = () => {
            modalOverlay.classList.add('opacity-0', 'pointer-events-none');
            modalContent.classList.add('scale-95');
            document.body.style.overflow = '';
        };

        joinButtons.forEach(btn => btn.addEventListener('click', openModal));
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
});
