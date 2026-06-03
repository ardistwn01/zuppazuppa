// dashboard.js – shared dashboard utilities (kosong, sudah di main.js)
// File ini dipertahankan untuk konsistensi import


// ================= MOBILE MENU =================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('nav ul') || document.querySelector('.nav-links');

if(menuToggle && navLinks){
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}
