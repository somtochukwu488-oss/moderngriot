-- Create events table
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT,
    event_date DATE,
    host_id UUID REFERENCES auth.users(id),
    allow_downloads BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: You also need to create a Storage Bucket named 'event-photos' in your Supabase dashboard and make it Public.
