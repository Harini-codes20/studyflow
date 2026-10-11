-- ============================================
-- StudyFlow Database Schema
-- ============================================
-- This schema represents the data model for the
-- StudyFlow Study Planner application.
--
-- Note: The current implementation uses a JSON file
-- (assignments.json) for simplicity. This schema is
-- provided for reference and future migration to a
-- real SQL database (SQLite, MySQL, or PostgreSQL).
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject     VARCHAR(100) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    deadline    DATE         NOT NULL,
    status      VARCHAR(20)  DEFAULT 'Pending'
                CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    priority    VARCHAR(10)  DEFAULT 'Medium'
                CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_assignments_status
    ON assignments(status);

-- Index for faster sorting by deadline
CREATE INDEX IF NOT EXISTS idx_assignments_deadline
    ON assignments(deadline);

-- Sample data (optional — for testing)
INSERT INTO assignments (subject, title, deadline, status, priority) VALUES
    ('Web Technology', 'HTML Forms',          '2026-10-15', 'Completed',   'Medium'),
    ('JavaScript',     'DOM Manipulation',    '2026-10-18', 'In Progress', 'High'),
    ('PHP',            'Form Validation',     '2026-10-20', 'Pending',     'High'),
    ('Database',       'SQL Joins Practice',  '2026-10-22', 'Pending',     'Medium'),
    ('Java',           'OOP Concepts',        '2026-10-25', 'Pending',     'Low');