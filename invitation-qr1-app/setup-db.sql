-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  default_scan_limit INTEGER,
  design_template_id TEXT,
  max_members INTEGER,
  whatsapp_message_template TEXT,
  event_start_date TEXT,
  event_end_date TEXT,
  location_address TEXT,
  location_link TEXT
);

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  scan_limit INTEGER NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 0,
  group_id TEXT NOT NULL
);

-- Create scan_logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  status TEXT NOT NULL
);

-- Create design_templates table
CREATE TABLE IF NOT EXISTS design_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  background_image TEXT NOT NULL,
  title_text TEXT NOT NULL,
  body_text TEXT NOT NULL,
  title_color TEXT NOT NULL,
  body_color TEXT NOT NULL,
  qr_code_size INTEGER,
  qr_code_pos_x INTEGER,
  qr_code_pos_y INTEGER,
  title_font TEXT,
  title_font_size INTEGER,
  body_font TEXT,
  body_font_size INTEGER,
  name_font TEXT,
  name_font_size INTEGER,
  show_event_dates BOOLEAN,
  qr_code_style TEXT,
  qr_code_color TEXT,
  qr_code_background_color TEXT,
  qr_code_corner_square_type TEXT,
  qr_code_corner_dot_type TEXT,
  qr_code_center_image TEXT,
  barcode_type TEXT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thank_you_message TEXT NOT NULL,
  follow_up_message TEXT NOT NULL
);

-- Insert default admin user
INSERT INTO users (id, username, password, role)
VALUES (gen_random_uuid()::TEXT, 'admin', 'admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default messages
INSERT INTO messages (id, thank_you_message, follow_up_message)
VALUES (
  gen_random_uuid()::TEXT,
  'مرحباً {memberName}، شكراً لحضورك فعالية "{eventName}". نتمنى أن تكون قد استمتعت!',
  'مرحباً {memberName}، لقد افتقدناك في فعاليتنا "{eventName}". نأمل أن نراك في المرة القادمة!'
)
ON CONFLICT DO NOTHING;
