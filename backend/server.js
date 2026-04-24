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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));