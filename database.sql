CREATE TABLE internships (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT,
    start_date DATE,
    end_date DATE,
    price NUMERIC(10,2),
    banner_url TEXT,
    mode TEXT CHECK (mode IN ('virtual', 'physical')),
    location TEXT,
    skills JSONB,
    certificate BOOLEAN DEFAULT false,
    certificate_title TEXT
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    domain TEXT,
    title TEXT NOT NULL,
    description TEXT,
    vacancy INTEGER,
    salary NUMERIC(10,2),
    location TEXT,
    company_name TEXT,
    year_experience INTEGER,
    qualification TEXT[],
    skills JSONB,
    start_date DATE,
    close_date DATE
);

CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    skills JSONB
);
