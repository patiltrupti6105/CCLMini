import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Account created! You are now logged in.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} required
        />
        <input
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
          type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} required
        />
        <button type="submit" style={{ width: '100%', padding: 10, background: '#3ECF8E', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      {message && <p style={{ color: 'red', marginTop: 10 }}>{message}</p>}
      <p style={{ marginTop: 15, cursor: 'pointer', color: '#3ECF8E' }}
        onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </p>
    </div>
  );
}