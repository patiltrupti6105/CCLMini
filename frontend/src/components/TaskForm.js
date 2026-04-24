import { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function TaskForm({ onTaskAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    await axios.post(`${process.env.REACT_APP_API_URL}/tasks`,
      { title, description, priority },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setTitle(''); setDescription(''); setPriority('medium');
    onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
      <h3>Add New Task</h3>
      <input
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        placeholder="Task title" value={title}
        onChange={e => setTitle(e.target.value)} required
      />
      <textarea
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }}
        placeholder="Description" value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <select
        style={{ marginBottom: 8, padding: 8 }}
        value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit" style={{ display: 'block', padding: '8px 20px', background: '#3ECF8E', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        Add Task
      </button>
    </form>
  );
}