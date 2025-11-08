import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { users, groups, members, scanLogs, designTemplates, messages } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === 'production' ? 5000 : 3000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Users endpoints
app.get('/api/users', async (_req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const [newUser] = await db.insert(users).values(req.body).returning();
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const [updatedUser] = await db
      .update(users)
      .set(req.body)
      .where(eq(users.id, req.params.id))
      .returning();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await db.delete(users).where(eq(users.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Groups endpoints
app.get('/api/groups', async (_req, res) => {
  try {
    const allGroups = await db.select().from(groups);
    res.json(allGroups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const groupData = {
      id: crypto.randomUUID(),
      ...req.body,
    };
    const [newGroup] = await db.insert(groups).values(groupData).returning();
    res.json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    const [updatedGroup] = await db
      .update(groups)
      .set(req.body)
      .where(eq(groups.id, req.params.id))
      .returning();
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    // Delete members first
    await db.delete(members).where(eq(members.groupId, req.params.id));
    // Then delete group
    await db.delete(groups).where(eq(groups.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Members endpoints
app.get('/api/members', async (_req, res) => {
  try {
    const allMembers = await db.select().from(members);
    res.json(allMembers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    // Generate ticket number: count members in the same group + 1
    const groupId = req.body.groupId;
    const existingMembers = await db.select().from(members).where(eq(members.groupId, groupId));
    const nextNumber = existingMembers.length + 1;
    const ticketNumber = nextNumber.toString().padStart(5, '0'); // e.g., "00001", "00002"
    
    const memberData = {
      id: crypto.randomUUID(),
      ticketNumber,
      scanCount: 0,
      rsvpStatus: 'pending',
      ...req.body,
    };
    const [newMember] = await db.insert(members).values(memberData).returning();
    res.json(newMember);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const [updatedMember] = await db
      .update(members)
      .set(req.body)
      .where(eq(members.id, req.params.id))
      .returning();
    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await db.delete(members).where(eq(members.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Scan Logs endpoints
app.get('/api/scan-logs', async (_req, res) => {
  try {
    const allLogs = await db.select().from(scanLogs);
    res.json(allLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan logs' });
  }
});

app.post('/api/scan-logs', async (req, res) => {
  try {
    const [newLog] = await db.insert(scanLogs).values(req.body).returning();
    res.json(newLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create scan log' });
  }
});

// Design Templates endpoints
app.get('/api/designs', async (_req, res) => {
  try {
    const allDesigns = await db.select().from(designTemplates);
    res.json(allDesigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

app.post('/api/designs', async (req, res) => {
  try {
    const [newDesign] = await db.insert(designTemplates).values(req.body).returning();
    res.json(newDesign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create design' });
  }
});

app.put('/api/designs/:id', async (req, res) => {
  try {
    const [updatedDesign] = await db
      .update(designTemplates)
      .set(req.body)
      .where(eq(designTemplates.id, req.params.id))
      .returning();
    res.json(updatedDesign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update design' });
  }
});

app.delete('/api/designs/:id', async (req, res) => {
  try {
    await db.delete(designTemplates).where(eq(designTemplates.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

// Messages endpoints
app.get('/api/messages', async (_req, res) => {
  try {
    const allMessages = await db.select().from(messages);
    res.json(allMessages.length > 0 ? allMessages[0] : null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.put('/api/messages/:id', async (req, res) => {
  try {
    const [updatedMessage] = await db
      .update(messages)
      .set(req.body)
      .where(eq(messages.id, req.params.id))
      .returning();
    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const [newMessage] = await db.insert(messages).values(req.body).returning();
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create messages' });
  }
});

// Initialize database with default data
app.post('/api/init', async (_req, res) => {
  try {
    // Check if admin user exists
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        username: 'admin',
        password: 'admin',
        role: 'admin',
      });
    }
    
    // Check if messages exist
    const existingMessages = await db.select().from(messages);
    if (existingMessages.length === 0) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        thankYouMessage: 'مرحباً {memberName}، شكراً لحضورك فعالية "{eventName}". نتمنى أن تكون قد استمتعت!',
        followUpMessage: 'مرحباً {memberName}، لقد افتقدناك في فعاليتنا "{eventName}". نأمل أن نراك في المرة القادمة!',
        rsvpMessage: 'مرحباً {memberName}، أنت مدعو لحضور "{eventName}". يرجى تأكيد حضورك بالرد على هذه الرسالة بـ "أؤكد" أو "أعتذر".',
      });
    } else {
      // Update existing messages to add rsvpMessage if missing
      const msg = existingMessages[0];
      if (!msg.rsvpMessage) {
        await db.update(messages).set({
          rsvpMessage: 'مرحباً {memberName}، أنت مدعو لحضور "{eventName}". يرجى تأكيد حضورك بالرد على هذه الرسالة بـ "أؤكد" أو "أعتذر".',
        }).where(eq(messages.id, msg.id));
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// Serve static files from dist folder in production
const distPath = path.join(__dirname, '..', 'dist');
console.log(`Looking for dist folder at: ${distPath}`);
console.log(`dist folder exists: ${fs.existsSync(distPath)}`);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`Serving static files from: ${distPath}`);
} else {
  console.warn(`Warning: dist folder not found at ${distPath}`);
}

// Serve index.html for all non-API routes (SPA fallback)
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send('Application not built. Please run: npm run build');
    }
  }
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Serving API from /api/* routes`);
  if (fs.existsSync(distPath)) {
    console.log(`Serving static files from ${distPath}`);
  }
});
