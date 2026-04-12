import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { AdminAuthContext } from './App';
import { authAPI } from './api';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const ALLOWED_ROLES = ['coordinator', 'admin', 'dev', 'captain'];

export default function LoginPage() {
  const { login } = useContext(AdminAuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    let interval;
    const initGoogle = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogle,
          ux_mode: 'popup',
          use_fedcm_for_prompt: true
        });
        
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: googleBtnRef.current.offsetWidth || 390,
            logo_alignment: 'left'
          });
        }

        setGoogleReady(true);
        if (interval) clearInterval(interval);
        return true;
      }
      return false;
    };

    if (!initGoogle()) {
      interval = setInterval(initGoogle, 100);
    }
    return () => clearInterval(interval);
  }, []);

  const handleGoogle = async (response) => {
    setLoading(true); setError('');
    try {
      const res = await authAPI.googleLogin(response.credential);
      const { user, token } = res.data;
      if (!ALLOWED_ROLES.includes(user.role)) {
        setError('Access denied. This portal is for coordinators, captains, and admins only.');
        return;
      }
      login(user, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) { 
      setError('System configuration error: Authentication service is unavailable.'); 
      return; 
    }

    if (!googleReady) {
      setError('Authentication service is still loading. Please wait a moment...');
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.warn('Google prompt not displayed:', notification.getNotDisplayedReason());
          // If One Tap is suppressed, let the user know or suggest refreshing
          if (notification.getNotDisplayedReason() === 'skipped_by_user') {
            setError('Google sign-in was recently dismissed. Please refresh or wait a moment.');
          }
        }
      });
    } catch (err) {
      console.error('Sign-in trigger error:', err);
      setError('Could not start sign-in process. Please refresh the page.');
    }
  };

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, var(--background-login-accent, #1a1a1a), #0a0a0a)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Abstract Background Shapes */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '30vw', height: '30vw', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '25vw', height: '25vw', background: 'var(--secondary)', filter: 'blur(100px)', opacity: 0.08, borderRadius: '50%' }}></div>

      <div className="card login-card fade-in" style={{
        maxWidth: 440,
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: 16, 
            background: 'var(--primary-gradient)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-lg)'
          }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem', color: 'white' }}>
            ECMEET<span style={{ color: 'var(--primary)' }}>'26</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
            Internal Management System
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.2)', 
            color: '#f43f5e', padding: '1rem', 
            borderRadius: 12, fontSize: '0.85rem', 
            marginBottom: '1.5rem', textAlign: 'left',
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
          }}>
            <Lock size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          justifyContent: 'center',
          minHeight: '44px' 
        }}>
          {loading ? (
            <button className="btn btn-primary" disabled style={{ width: '100%', borderRadius: 12 }}>
              <Loader2 className="animate-spin" size={20} />
              Authenticating...
            </button>
          ) : (
            <div 
              ref={googleBtnRef} 
              style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
