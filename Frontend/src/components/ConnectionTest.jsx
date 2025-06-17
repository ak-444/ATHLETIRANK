import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const ConnectionTest = () => {
    const [connectionStatus, setConnectionStatus] = useState('Testing...');
    const [connectionColor, setConnectionColor] = useState('orange');

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        try {
            const response = await authService.testConnection();
            setConnectionStatus(`✅ Backend Connected: ${response.message}`);
            setConnectionColor('green');
        } catch (error) {
            setConnectionStatus(`❌ Backend Connection Failed: ${error.message}`);
            setConnectionColor('red');
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            margin: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: `2px solid ${connectionColor}`
        }}>
            <h3>Backend Connection Status</h3>
            <p style={{ color: connectionColor, fontWeight: 'bold' }}>
                {connectionStatus}
            </p>
            <button 
                onClick={testBackendConnection}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Test Again
            </button>
        </div>
    );
};

export default ConnectionTest;