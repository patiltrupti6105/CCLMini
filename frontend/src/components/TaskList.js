import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function TaskList({ refresh }) {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setTasks(res.data);
  };

  useEffect(() => { fetchTasks(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('tasks-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tasks'
      }, () => fetchTasks())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const deleteTask = async (id) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks();
  };

  const updateStatus = async (id, status) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await axios.patch(`${process.env.REACT_APP_API_URL}/tasks/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks();
  };

  const statusColor = { todo: '#f0ad4e', in_progress: '#5bc0de', done: '#5cb85c' };

  return (
    <div>
      <h3>My Tasks ({tasks.length})</h3>
      {tasks.length === 0 && <p style={{ color: '#999' }}>No tasks yet. Add one above!</p>}
      {tasks.map(task => (
        <div key={task.id} style={{ padding: 12, marginBottom: 10, border: '1px solid #ddd', borderRadius: 8, borderLeft: `4px solid ${statusColor[task.status]}` }}>
          <strong>{task.title}</strong>
          <span style={{ marginLeft: 10, fontSize: 12, background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{task.priority}</span>
          <p style={{ margin: '4px 0', color: '#555' }}>{task.description}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4 }}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button onClick={() => deleteTask(task.id)}
              style={{ padding: '4px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}