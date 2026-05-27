CREATE DATABASE IF NOT EXISTS lekhadb;
USE lekhadb;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(20) UNIQUE NOT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (role_id, role_name) VALUES 
(1,'student'),(2,'guide'),(3,'hod'),(4,'admin');

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Project Groups
CREATE TABLE IF NOT EXISTS project_groups (
    group_id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100) NOT NULL,
    project_topic VARCHAR(255),
    guide_id INT,
    academic_year VARCHAR(20) DEFAULT '2024-25',
    department VARCHAR(100) DEFAULT 'Computer Science',
    status ENUM('active','completed','archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    group_id INT,
    roll_no VARCHAR(20),
    department VARCHAR(100) DEFAULT 'Computer Science',
    academic_year VARCHAR(20) DEFAULT '2024-25',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Meeting Logs
CREATE TABLE IF NOT EXISTS meeting_logs (
    meet_id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT,
    meet_date DATE NOT NULL,
    topic VARCHAR(255),
    suggestions TEXT,
    comment_from_guide TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Project Files (stores file as BLOB in DB)
CREATE TABLE IF NOT EXISTS project_files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    file_data LONGBLOB NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT,
    version INT DEFAULT 1,
    status ENUM('pending','approved','rejected','revision_needed') DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    comment_from_guide TEXT,
    FOREIGN KEY (group_id) REFERENCES project_groups(group_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50),
    record_id INT,
    action VARCHAR(50),
    action_by INT,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (action_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notif_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- SEED DATA - Guides (password: 12345)
-- =============================================
INSERT INTO users (full_name, email, password_hash, role_id) VALUES
('Prof. Shraddha Rokade',    'shraddharokade@umit.in',      SHA2('12345',256), 2),
('Ms. Samidha Vengurlekar',  'samidhavengurlekar@umit.in',  SHA2('12345',256), 2),
('Dr. Rachana Dhannawat',    'rachanadhannawat@umit.in',    SHA2('12345',256), 2),
('Prof. Iffat Kazi',         'iffatkazi@umit.in',           SHA2('12345',256), 2),
('Toshi Jain',               'toshijain@umit.in',           SHA2('12345',256), 2),
('Sanjaykumar Ranveer',      'sanjayranveer@umit.in',       SHA2('12345',256), 2),
('Prachi Dhannawat',         'prachi@umit.in',              SHA2('12345',256), 2),
('Rajesh Kolte',             'rajesh@umit.in',              SHA2('12345',256), 2),
('System Admin',             'admin@lekha.edu',             SHA2('admin123',256), 4);

-- =============================================
-- SEED DATA - Students (password: 12345)
-- =============================================
INSERT INTO users (full_name, email, password_hash, role_id) VALUES
('Nehakumari Mandal',    'nehakumari120mandal@gmail.com',  SHA2('12345',256), 1),
('Ira M. Mane',          'irammane14@gmail.com',           SHA2('12345',256), 1),
('Vaishnavi Shinde',     'vaishnavibshinde2004@gmail.com', SHA2('12345',256), 1),
('Sanika Sutar',         'sanikassutar@gmail.com',         SHA2('12345',256), 1),
('Siddhi Sutar',         'siddhi121003@gmail.com',         SHA2('12345',256), 1),
('Neha Kulkarni',        'nsk00311@gmail.com',             SHA2('12345',256), 1),
('Saloni Lad',           'salonimlad@gmail.com',           SHA2('12345',256), 1),
('Shivani Lad',          'shivanimlad@gmail.com',          SHA2('12345',256), 1),
('Sneha Nevhal',         'snehanevhal@gmail.com',          SHA2('12345',256), 1),
('Sarita Yadav',         'yadavsaritassingh113@gmail.com', SHA2('12345',256), 1),
('Rajshri Suranje',      'suranjerajshri04@gmail.com',     SHA2('12345',256), 1),
('Vedika Sonawane',      'vedikaa1107@gmail.com',          SHA2('12345',256), 1),
('Yuga Wade',            'yugawade10@gmail.com',           SHA2('12345',256), 1),
('Harshada Jagade',      'harshadaj177@gmail.com',         SHA2('12345',256), 1),
('Prerna Kumari Jha',    'satvikritu03@gmail.com',         SHA2('12345',256), 1),
('Harshita Singh',       'harshitasingh1406@gmail.com',   SHA2('12345',256), 1),
('Gargi Nitin Pate',     'pategargi3002@gmail.com',        SHA2('12345',256), 1),
('Hardi Bhupesh Patil',  'hardipatil331@gmail.com',        SHA2('12345',256), 1),
('Gayathri Ganeshan Nair','gayuganeshnair@gmail.com',      SHA2('12345',256), 1),
('Vaishnavi Metkari',    'vaishnavimetkari5@gmail.com',    SHA2('12345',256), 1),
('Rucha Patil',          'ruchapatil0212@gmail.com',       SHA2('12345',256), 1),
('Narayani Shelke',      'narayanishelke@example.com',     SHA2('12345',256), 1),
('Ritu Bhosale',         'ritubhosale18@gmail.com',        SHA2('12345',256), 1),
('Mahek Shaikh',         'shaikhmahek1906@gmail.com',      SHA2('12345',256), 1),
('Rutuja Sonde',         'rutussonde@gmail.com',           SHA2('12345',256), 1);

-- =============================================
-- Project Groups (guide_id matches insert order)
-- Guide 1=Shraddha(1), 2=Samidha(2), 3=Rachana(3), 4=Iffat(4), 7=Prachi(7), 8=Rajesh(8)
-- =============================================
INSERT INTO project_groups (group_name, project_topic, guide_id, academic_year, department) VALUES
('Blockchain Transfers', 'A Decentralized System to Enhance Interbank Transfers Using Blockchain & AI', 1, '2024-25', 'Computer Science'),
('GENESIGHTS',           'Prediction of Genetic Disorders using ML',                                    2, '2024-25', 'Computer Science'),
('Agri Supply Chain',    'Supply Chain Management in Agriculture',                                      3, '2024-25', 'Computer Science'),
('DermaScan AI',         'AI-based Skin Cancer Detection',                                              1, '2024-25', 'Computer Science'),
('Infosleuth',           'Financial Document Analysis System',                                          4, '2024-25', 'Computer Science'),
('GENEGUARD',            'Empowering You with Genetic Insight',                                         1, '2024-25', 'Computer Science'),
('FRED ROGER THAT',      'Mobile App Project',                                                          3, '2024-25', 'Computer Science'),
('Road Accident Detection','Accident Detection using Deep Learning',                                    7, '2024-25', 'Computer Science'),
('Mental Health App',    'Mental Health Tracking Application',                                          8, '2024-25', 'Computer Science');

-- =============================================
-- Student Profiles (user_id: guides are 1-9, students start at 10)
-- =============================================
INSERT INTO student_profiles (user_id, group_id, roll_no) VALUES
(10, 1, '2114031'),
(11, 1, '2114032'),
(12, 2, '2114057'),
(13, 2, '2114063'),
(14, 2, '2114064'),
(15, 3, '2114025'),
(16, 3, '2114027'),
(17, 3, '2114028'),
(18, 4, '2114038'),
(19, 4, '2114070'),
(20, 4, '2114078'),
(21, 5, '2114061'),
(22, 5, '2114068'),
(23, 6, '15'),
(24, 6, '17'),
(25, 6, '59'),
(26, 7, '2114042'),
(27, 7, '2114046'),
(28, 7, '2114037'),
(29, 8, '2013035'),
(30, 8, '2013041'),
(31, 8, '2013048'),
(32, 9, '2013010'),
(33, 9, '2013077'),
(34, NULL, '2310162');

-- Sample meeting logs
INSERT INTO meeting_logs (group_id, meet_date, topic, suggestions, created_by) VALUES
(1, '2026-03-01', 'Project Kickoff', 'Discussed blockchain architecture and initial design', 10),
(2, '2026-03-02', 'Data Collection', 'Gathered genetic dataset from public sources', 12);

SELECT 'Database setup complete!' as status;
SELECT u.user_id, u.full_name, u.email, r.role_name FROM users u JOIN roles r ON u.role_id=r.role_id ORDER BY u.role_id, u.user_id;
