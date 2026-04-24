import { useState, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export default function TaskForm({ onTaskAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Step 1: Create the task
    const res = await axios.post(
      `${process.env.REACT_APP_API_URL}/tasks`,
      { title, description, priority },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const newTaskId = res.data.id;

    // Step 2: Upload image if selected
    if (imageFile && newTaskId) {
      const formData = new FormData();
      formData.append('image', imageFile);
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/tasks/${newTaskId}/upload`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
      } catch (err) {
        alert('Task created but image upload failed: ' + (err.response?.data?.error || err.message));
      }
    }

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);
    onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Add New Task</h3>

      <input
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, boxSizing: 'border-box' }}
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <textarea
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, boxSizing: 'border-box' }}
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc' }}
          value={priority}
          onChange={e => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageSelect}
        />

        {/* Attach image button */}
        {!imageFile && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '7px 14px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            📎 Attach image
          </button>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{ marginBottom: 12, position: 'relative', display: 'inline-block' }}>
          <img
            src={imagePreview}
            alt="preview"
            style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 6, objectFit: 'cover', display: 'block' }}
          />
          <button
            type="button"
            onClick={removeImage}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer',
              fontSize: 14, lineHeight: '24px', textAlign: 'center', padding: 0
            }}>
            ✕
          </button>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>{imageFile.name}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ padding: '8px 20px', background: loading ? '#aaa' : '#3ECF8E', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Adding...' : 'Add Task'}
      </button>
    </form>
  );
}