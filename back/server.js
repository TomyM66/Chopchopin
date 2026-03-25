'use strict';
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const db      = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ══ INSCRIPTION ══
app.post('/api/inscription', async (req, res) => {
  const { pseudo, email, code } = req.body;
  if (!pseudo || !email || !code)
    return res.status(400).json({ erreur: 'Champs manquants' });

  try {
    const hash = await bcrypt.hash(code, 10);
    await db.execute(
      'INSERT INTO utilisateurs (pseudo, email, code) VALUES (?, ?, ?)',
      [pseudo, email, hash]
    );
    res.json({ message: 'Inscription réussie' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ erreur: 'Email déjà utilisé' });
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ CONNEXION ══
app.post('/api/connexion', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ erreur: 'Champs manquants' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM utilisateurs WHERE email = ?', [email]
    );
    if (!rows.length)
      return res.status(401).json({ erreur: 'Email ou code incorrect' });

    const ok = await bcrypt.compare(code, rows[0].code);
    if (!ok)
      return res.status(401).json({ erreur: 'Email ou code incorrect' });

    const { code: _, ...user } = rows[0];
    res.json({ message: 'Connexion réussie', utilisateur: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ SAUVEGARDER MORCEAU (notes texte) ══
app.post('/api/morceaux', async (req, res) => {
  const { utilisateur_id, titre, accessibilite, vitesse, notes } = req.body;
  if (!utilisateur_id || !titre)
    return res.status(400).json({ erreur: 'Champs manquants' });

  try {
    const [result] = await db.execute(
      'INSERT INTO morceaux (utilisateur_id, titre, accessibilite, vitesse, notes) VALUES (?, ?, ?, ?, ?)',
      [utilisateur_id, titre, accessibilite || 'publique', vitesse || 90, notes || '']
    );
    res.json({ message: 'Morceau sauvegardé', id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ RÉCUPÉRER MES MORCEAUX ══
app.get('/api/morceaux/:utilisateur_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, titre, accessibilite, vitesse, notes, created_at FROM morceaux WHERE utilisateur_id = ? ORDER BY created_at DESC',
      [req.params.utilisateur_id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ SUPPRIMER UN MORCEAU ══
app.delete('/api/morceaux/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM morceaux WHERE id = ?', [req.params.id]);
    res.json({ message: 'Morceau supprimé' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ SAUVEGARDER ENREGISTREMENT AUDIO ══
app.post('/api/enregistrements', async (req, res) => {
  const { utilisateur_id, titre, accessibilite, audio_data, duree_ms } = req.body;
  if (!utilisateur_id || !titre || !audio_data)
    return res.status(400).json({ erreur: 'Champs manquants' });

  try {
    const [result] = await db.execute(
      'INSERT INTO enregistrements (utilisateur_id, titre, accessibilite, audio_data, duree_ms) VALUES (?, ?, ?, ?, ?)',
      [utilisateur_id, titre, accessibilite || 'publique', audio_data, duree_ms || 0]
    );
    res.json({ message: 'Enregistrement sauvegardé', id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ RÉCUPÉRER MES ENREGISTREMENTS ══
app.get('/api/enregistrements/:utilisateur_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, titre, accessibilite, duree_ms, audio_data, created_at FROM enregistrements WHERE utilisateur_id = ? ORDER BY created_at DESC',
      [req.params.utilisateur_id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// ══ SUPPRIMER UN ENREGISTREMENT ══
app.delete('/api/enregistrements/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM enregistrements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Enregistrement supprimé' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

app.listen(3000, () => console.log('✅ API ChoChopin sur http://localhost:3000'));
