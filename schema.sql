-- Safety Inspection Reports Database Schema
DROP TABLE IF EXISTS reports;

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_of_inspection TEXT NOT NULL,
    location TEXT NOT NULL,
    inspector_name TEXT NOT NULL,
    observed_hazard TEXT NOT NULL,
    severity_rating TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date_of_inspection);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports(location);
