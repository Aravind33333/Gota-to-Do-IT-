import React from 'react';
import './Welcome.css';

function Welcome({ user, onLogout }) {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">Welcome!</h1>
        
        <div className="user-profile">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="user-avatar"
            />
          )}
          
          <div className="user-details">
            <h2 className="user-name">{user.name}</h2>
            <p className="user-email">{user.email}</p>
            {user.id && (
              <p className="user-id">User ID: {user.id}</p>
            )}
          </div>
        </div>

        <div className="welcome-actions">
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
