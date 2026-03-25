CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pseudo VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS morceaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  titre VARCHAR(100) NOT NULL,
  accessibilite ENUM('publique','privée') DEFAULT 'publique',
  vitesse INT DEFAULT 90,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS enregistrements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  titre VARCHAR(100) NOT NULL,
  accessibilite ENUM('publique','privée') DEFAULT 'publique',
  audio_data LONGTEXT NOT NULL,
  duree_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);
