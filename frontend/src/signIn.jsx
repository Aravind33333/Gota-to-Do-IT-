import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Welcome from './Welcome';
import './signIn.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '782294991608-lqo56sq2hkim7o8n4fsi2t9ld2aksf45.apps.googleusercontent.com';

function SignIn() {
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const BASE_API = import.meta.env.VITE_API_BASE_URL;

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('Google user info:', decoded);
    
    try {
      // OAuth login (auto-registers if first time)
      const response = await axios.post(`${BASE_API}/oauth_login`, {
        email: decoded.email,
        oauth_provider: 'google',
        oauth_id: decoded.sub,
        username: decoded.name,
        picture: decoded.picture
      });
      
      setUser({
        name: response.data.user.username,
        email: response.data.user.email,
        picture: response.data.user.picture || decoded.picture,
        id: response.data.user.id
      });
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
    alert('Google login failed');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Sign Up validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      try {
        await axios.post(`${BASE_API}/register`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          oauth_provider: null,
          oauth_id: null,
          picture: null
        });
        
        // Auto login after signup
        const response = await axios.post(`${BASE_API}/login`, {
          email: formData.email,
          password: formData.password
        });
        
        setUser({
          name: response.data.user.username,
          email: response.data.user.email,
          picture: response.data.user.picture,
          id: response.data.user.id
        });
      } catch (error) {
        console.error('Sign up error:', error);
        setError(error.response?.data?.detail || 'Sign up failed. Please try again.');
      }
    } else {
      // Sign In
      try {
        const response = await axios.post(`${BASE_API}/login`, {
          email: formData.email,
          password: formData.password
        });
        
        setUser({
          name: response.data.user.username,
          email: response.data.user.email,
          picture: response.data.user.picture,
          id: response.data.user.id
        });
      } catch (error) {
        console.error('Login error:', error);
        setError(error.response?.data?.detail || 'Login failed. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  // Show welcome page if user is logged in
  if (user) {
    return <Welcome user={user} onLogout={handleLogout} />;
  }
    
  // Show sign-in/sign-up page if user is not logged in
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="signin-container">
        <div className="signin-card">
          <h1 className="signin-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
          
          <div className="google-section">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              size="large"
              text={isSignUp ? "signup_with" : "signin_with"}
              shape="rectangular"
            />
          </div>

          <div className="divider">
            <span className="divider-text">OR</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form className="signin-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="input-group">
                <label htmlFor="username" className="input-label">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  required 
                  className="input-field"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>
            )}
            
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                className="input-field"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                className="input-field"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            
            {isSignUp && (
              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  required 
                  className="input-field"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}
            
            <button type="submit" className="signin-button">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); toggleMode(); }} style={{ color: '#4285f4', cursor: 'pointer' }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </a>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default SignIn;