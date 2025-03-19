import React, { useState, useEffect } from 'react';
import { roomMapping, bhawanMapping } from '../../data/data';

const Allot = () => {
    const [userId, setUserId] = useState('');
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user'); // Assuming 'user' key stores authentication details
        
        if (!user) {
            alert('Not logged in');
            window.location.href = '/'; // Redirect to login page
        }
    }, []);

    const handleSearch = async () => {
        if (!userId.trim()) {
            setError('Please enter a valid user ID');
            return;
        }

        setLoading(true);
        setError('');
        setUserDetails(null);

        try {
            const response = await fetch(`http://localhost:5000/allot/user/${userId}`);
            const data = await response.json();
    
            if (response.ok) {
                let updatedDetails = { ...data };
    
                if (data.roomId) {
                    const splitData = data.roomId.split('_');
                    console.log('Split Data:', splitData);
    
                    if (splitData.length === 3) {
                        const [hostelCode, roomTypeCode, roomNumber] = splitData;
    
                        // Direct lookup from mapping objects
                        const hostelName = bhawanMapping[hostelCode] || 'Unknown Hostel';
                        const roomTypeName = roomMapping[roomTypeCode] || 'Unknown Room Type';
    
                        updatedDetails = {
                            ...updatedDetails,
                            hostel: hostelName,
                            roomType: roomTypeName,
                            roomNumber: roomNumber || 'N/A'
                        };
                    }
                }
    
                setUserDetails(updatedDetails);
            } else {
                setError(data.error || 'Failed to fetch user details');
            }
        } catch (err) {
            console.error('Error fetching user details:', err);
            setError('An error occurred while fetching user details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="allot-container">
            <div className="search-section">
                <h2>Find User Accommodation Details</h2>
                <div className="search-bar">
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter User ID"
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {error && <div className="error-message">{error}</div>}
            </div>

            {userDetails && (
                <div className="user-details-card">
                    <h3>User Accommodation Details</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">User ID:</span>
                            <span className="detail-value">{userId}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Hostel:</span>
                            <span className="detail-value">{userDetails.hostel || 'Not assigned'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Room Type:</span>
                            <span className="detail-value">{userDetails.roomType || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Room Number:</span>
                            <span className="detail-value">{userDetails.roomNumber || 'Not assigned'}</span>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="loading-indicator">
                    <p>Searching for user details...</p>
                </div>
            )}
        </div>
    );
};

export default Allot;