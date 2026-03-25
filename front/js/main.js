'use strict';

const API = '/api';

document.addEventListener('DOMContentLoaded', () => {

    // ── Connexion ──
    const btnConnecter = document.getElementById('btn-connecter');
    if (btnConnecter) {
        btnConnecter.addEventListener('click', connecter);
        document.addEventListener('keypress', e => { if (e.key === 'Enter') connecter(); });
    }

    // ── Inscription ──
    const btnInscrire = document.getElementById('btn-inscrire');
    if (btnInscrire) {
        btnInscrire.addEventListener('click', inscrire);
        document.addEventListener('keypress', e => { if (e.key === 'Enter') inscrire(); });
    }

});

async function connecter() {
    const email     = document.getElementById('email').value.trim();
    const code      = document.getElementById('code').value.trim();
    const messageEl = document.getElementById('message');

    if (!email || !code) {
        afficherMessage(messageEl, 'Veuillez remplir tous les champs', 'error');
        return;
    }

    try {
        const res  = await fetch(`${API}/connexion`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, code })
        });
        const data = await res.json();

        if (res.ok) {
            sessionStorage.setItem('utilisateurConnecte', JSON.stringify(data.utilisateur));
            afficherMessage(messageEl, 'Connexion réussie !', 'success');
            setTimeout(() => { window.location.href = 'chopchopin.html'; }, 1000);
        } else {
            afficherMessage(messageEl, data.erreur || 'Erreur inconnue', 'error');
        }
    } catch (e) {
        afficherMessage(messageEl, 'Impossible de contacter le serveur', 'error');
    }
}

async function inscrire() {
    const pseudo    = document.getElementById('pseudo').value.trim();
    const email     = document.getElementById('email').value.trim();
    const code      = document.getElementById('code').value.trim();
    const messageEl = document.getElementById('message');

    if (!pseudo || !email || !code) {
        afficherMessage(messageEl, 'Veuillez remplir tous les champs', 'error');
        return;
    }

    try {
        const res  = await fetch(`${API}/inscription`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ pseudo, email, code })
        });
        const data = await res.json();

        if (res.ok) {
            afficherMessage(messageEl, 'Inscription réussie !', 'success');
            document.getElementById('pseudo').value = '';
            document.getElementById('email').value  = '';
            document.getElementById('code').value   = '';
            setTimeout(() => { window.location.href = 'accueil.html'; }, 2000);
        } else {
            afficherMessage(messageEl, data.erreur || 'Erreur inconnue', 'error');
        }
    } catch (e) {
        afficherMessage(messageEl, 'Impossible de contacter le serveur', 'error');
    }
}

function afficherMessage(el, texte, type) {
    el.textContent   = texte;
    el.className     = `message ${type}`;
    el.style.display = 'block';
}
