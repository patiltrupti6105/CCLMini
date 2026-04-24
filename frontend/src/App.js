import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

export default function App() {
  const [session, setSession] = useState(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) return <Auth />;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>📋 Task Manager</h1>
        <div>
          <span style={{ marginRight: 12, color: '#555' }}>{session.user.email}</span>
          <button onClick={handleSignOut}
            style={{ padding: '6px 14px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>
      <TaskForm onTaskAdded={() => setRefresh(r => r + 1)} />
      <TaskList refresh={refresh} />
    </div>
  );
}