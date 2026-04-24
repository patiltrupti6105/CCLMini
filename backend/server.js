// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware: Verify Supabase JWT
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// Health check
app.get('/', (req, res) => res.json({ status: 'Task Manager API running' }));

// GET /tasks
app.get('/tasks', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /tasks
app.post('/tasks', authenticate, async (req, res) => {
  const { title, description, priority, due_date } = req.body;
  const { data, error } = await supabase.from('tasks').insert({
    user_id: req.user.id, title, description, priority, due_date
  }).select().single();

  if (error) return res.status(400).json({ error });
  res.status(201).json(data);
});

// PATCH /tasks/:id
app.patch('/tasks/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, due_date } = req.body;
  const { data, error } = await supabase.from('tasks')
    .update({ title, description, status, priority, due_date })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select().single();

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /tasks/:id/upload — attach an image to a task
app.post('/tasks/:id/upload', authenticate, upload.single('image'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }

  // Store under: userId/taskId-timestamp.ext
  const ext = req.file.originalname.split('.').pop();
  const filePath = `${req.user.id}/${id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  // Save URL to the task row
  const { data, error } = await supabase.from('tasks')
    .update({ file_url: publicUrl })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data, url: publicUrl });
});

// DELETE /tasks/:id/image — remove image from a task
app.delete('/tasks/:id/image', authenticate, async (req, res) => {
  const { id } = req.params;

  // Get current file_url
  const { data: task } = await supabase.from('tasks')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (task?.file_url) {
    // Extract path from the URL
    const path = task.file_url.split('/images/')[1];
    await supabase.storage.from('images').remove([path]);
  }

  // Clear the file_url in DB
  const { data, error } = await supabase.from('tasks')
    .update({ file_url: null })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));