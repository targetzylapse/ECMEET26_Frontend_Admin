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
            shape: 'rectangular',
            width: googleBtnRef.current.offsetWidth || 350,
            logo_alignment: 'center'
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
      background: '#000000',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Inter", "DM Sans", sans-serif'
    }}>
      <div className="card login-card fade-in" style={{
        maxWidth: 400,
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        background: '#0a0a0a',
        border: '1px solid #222222',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: '50%', 
            background: '#ffffff', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 1.5rem', boxShadow: '0 4px 14px 0 rgba(255,255,255,0.1)'
          }}>
            <Lock size={24} color="#000000" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: '#ffffff' }}>
            ECMEET'26
          </h1>
        </div>

        {error && (
          <div style={{ 
            background: '#1a1a1a', 
            border: '1px solid #333333', 
            color: '#ffffff', padding: '0.85rem 1rem', 
            borderRadius: '6px', fontSize: '0.85rem', 
            marginBottom: '1.5rem', textAlign: 'left',
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
          }}>
            <Lock size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#888' }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ 
          marginBottom: '1rem', 
          display: 'flex', 
          justifyContent: 'center',
          minHeight: '44px' 
        }}>
          {loading ? (
            <button disabled style={{ 
              width: '100%', borderRadius: '4px', background: '#ffffff', color: '#000000', 
              border: 'none', padding: '0.75rem', display: 'flex', justifyContent: 'center', 
              alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.95rem',
              cursor: 'not-allowed'
            }}>
              <Loader2 className="animate-spin" size={18} />
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
