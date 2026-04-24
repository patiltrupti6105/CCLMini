import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function TaskList({ refresh }) {
  const [tasks, setTasks] = useState([]);
  const [uploading, setUploading] = useState(null); // taskId being uploaded
  const fileInputRefs = useRef({});

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchTasks = async () => {
    const token = await getToken();
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setTasks(res.data);
  };

  useEffect(() => { fetchTasks(); }, [refresh]);

  useEffect(() => {
    const channel = supabase.channel('tasks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const deleteTask = async (id) => {
    const token = await getToken();
    await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks();
  };

  const updateStatus = async (id, status) => {
    const token = await getToken();
    await axios.patch(`${process.env.REACT_APP_API_URL}/tasks/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks();
  };

  const handleImageUpload = async (taskId, file) => {
    if (!file) return;
    setUploading(taskId);
    const token = await getToken();
    const formData = new FormData();
    formData.append('image', file);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/tasks/${taskId}/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = async (taskId) => {
    const token = await getToken();
    await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/image`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchTasks();
  };

  const statusColor = { todo: '#f0ad4e', in_progress: '#5bc0de', done: '#5cb85c' };
  const priorityBadge = { low: '#aaa', medium: '#5bc0de', high: '#d9534f' };

  return (
    <div>
      <h3>My Tasks ({tasks.length})</h3>
      {tasks.length === 0 && <p style={{ color: '#999' }}>No tasks yet. Add one above!</p>}
      {tasks.map(task => (
        <div key={task.id} style={{
          padding: 16, marginBottom: 12, border: '1px solid #ddd',
          borderRadius: 8, borderLeft: `4px solid ${statusColor[task.status]}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ fontSize: 16 }}>{task.title}</strong>
              <span style={{
                marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10,
                background: priorityBadge[task.priority], color: '#fff'
              }}>{task.priority}</span>
            </div>
          </div>

          {task.description && <p style={{ margin: '6px 0', color: '#555', fontSize: 14 }}>{task.description}</p>}

          {/* Image display */}
          {task.file_url && (
            <div style={{ marginTop: 10 }}>
              <img
                src={task.file_url}
                alt="attachment"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 6, objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={() => handleRemoveImage(task.id)}
                style={{ marginTop: 4, fontSize: 12, padding: '2px 8px', background: '#fff', border: '1px solid #d9534f', color: '#d9534f', borderRadius: 4, cursor: 'pointer' }}>
                Remove image
              </button>
            </div>
          )}

          {/* Image upload */}
          {!task.file_url && (
            <div style={{ marginTop: 10 }}>
              <input
                type="file"
                accept="image/*"
                ref={el => fileInputRefs.current[task.id] = el}
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(task.id, e.target.files[0])}
              />
              <button
                onClick={() => fileInputRefs.current[task.id]?.click()}
                disabled={uploading === task.id}
                style={{ fontSize: 13, padding: '4px 12px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
                {uploading === task.id ? '⏳ Uploading...' : '📎 Attach image'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button onClick={() => deleteTask(task.id)}
              style={{ padding: '4px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}