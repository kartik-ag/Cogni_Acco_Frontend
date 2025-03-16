import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Controls.css";

const Controls = () => {
  const [allRoomData, setAllRoomData] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const location = useLocation();
  const users = location.state?.users || [];
  const [selectedHostel, setSelectedHostel] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [hostels, setHostels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomIds, setRoomIds] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [peopleToAdd, setPeopleToAdd] = useState(1);
  const [updateMessage, setUpdateMessage] = useState("");

  // New state for user IDs
  const [userIds, setUserIds] = useState([""]);
  const [showUserIdInputs, setShowUserIdInputs] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user'); // Assuming 'user' key stores authentication details

    if (!user) {
      alert('Not logged in');
      window.location.href = '/'; // Redirect to login page
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/allot/room_details")
      .then((res) => res.json())
      .then((data) => {
        setAllRoomData(data);
        setHostels(Object.keys(data));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching room data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedHostel && allRoomData[selectedHostel]) {
      const hostelData = allRoomData[selectedHostel];
      const availableRoomTypes = hostelData.map(item => item.roomType);

      setRoomTypes(availableRoomTypes);
      setSelectedRoomType("");
      setSelectedRoomId("");
      setSelectedRoom(null);
    } else {
      setRoomTypes([]);
    }
  }, [selectedHostel, allRoomData]);

  useEffect(() => {
    if (selectedHostel && selectedRoomType && allRoomData[selectedHostel]) {
      const roomTypeData = allRoomData[selectedHostel].find(
        item => item.roomType === selectedRoomType
      );

      if (roomTypeData && roomTypeData.rooms) {
        setRoomIds(roomTypeData.rooms);
      } else {
        setRoomIds([]);
      }

      setSelectedRoomId("");
      setSelectedRoom(null);
    } else {
      setRoomIds([]);
    }
  }, [selectedHostel, selectedRoomType, allRoomData]);

  // Reset user IDs whenever peopleToAdd changes
  useEffect(() => {
    const count = parseInt(peopleToAdd) || 0;
    
    if (users.length > 0 && count <= users.length) {
      // Use the strings directly since users are already IDs
      setUserIds(users.slice(0, count));
    } else {
      setUserIds(Array(count).fill(""));
    }
  }, [peopleToAdd, users]);

  const fetchRoomDetails = useCallback(() => {
    if (!selectedRoomId) return;
    
    fetch(`http://localhost:5000/allot/${selectedRoomId}`)
      .then(res => res.json())
      .then(roomData => {
        setSelectedRoom(roomData);
        setLoading(false);
        
        // Set initial peopleToAdd based on users array if available
        if (users.length > 0) {
          const availableSpace = roomData.occupancy - roomData.occupied;
          const initialPeopleCount = Math.min(users.length, availableSpace);
          setPeopleToAdd(initialPeopleCount);
          
          // Initialize userIds with users data - FIXED
          setUserIds(users.slice(0, initialPeopleCount));
        } else {
          setPeopleToAdd(1);
          setUserIds([""]);
        }
        
        setUpdateMessage("");
        setShowUserIdInputs(false);
      })
      .catch(err => {
        console.error("Error fetching room details:", err);
        setLoading(false);
      });
  }, [selectedRoomId, users]);

  // Use the useCallback version in the effect
  useEffect(() => {
    if (selectedRoomId) {
      setLoading(true);
      fetchRoomDetails();
    }
  }, [selectedRoomId, fetchRoomDetails]);

  const handleUserIdChange = (index, value) => {
    const newUserIds = [...userIds];
    newUserIds[index] = value;
    setUserIds(newUserIds);
  };

  const validateUserIds = () => {
    // Check if all user IDs are filled
    return userIds.every(id => id.trim() !== "");
  };

  const handleShowUserIdInputs = () => {
    const availableSpace = selectedRoom.occupancy - selectedRoom.occupied;

    if (peopleToAdd <= 0) {
      setUpdateMessage("Please add at least one person.");
      return;
    }

    if (peopleToAdd > availableSpace) {
      setUpdateMessage(`Cannot add ${peopleToAdd} people. Only ${availableSpace} spaces available.`);
      return;
    }

    setShowUserIdInputs(true);
    setUpdateMessage("");
  };

  const handleAddPeople = () => {
    if (!validateUserIds()) {
      setUpdateMessage("Please fill in all user IDs.");
      return;
    }

    setUpdating(true);
    setUpdateMessage("Updating...");

    const updatedOccupied = selectedRoom.occupied + parseInt(peopleToAdd);

    fetch(`http://localhost:5000/allot/update-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: selectedRoomId,
        newOccupied: updatedOccupied,
        members: userIds  // Send the user IDs to be added
      }),
    })
      .then(res => res.json())
      .then(response => {
        setUpdating(false);
        if (response.success) {
          alert("Added successfully")
          setUpdateMessage(`Successfully added ${peopleToAdd} people to the room.`);
          setShowUserIdInputs(false);
          fetchRoomDetails();
          window.location.href = "/ticketing"
        } else {
          setUpdateMessage(`Error: ${response.error || 'Failed to update room occupancy.'}`);
        }
      })
      .catch(err => {
        console.error("Error updating room:", err);
        setUpdating(false);
        setUpdateMessage("Failed to update. Please try again.");
      });
  };

  const renderUserIdInputs = () => {
    return (
      <div className="user-id-inputs">
        <h4>Enter User IDs</h4>
        {userIds.map((userId, index) => (
          <div key={index} className="input-group user-id-input">
            <label htmlFor={`user-id-${index}`}>User ID {index + 1}:</label>
            <input
              id={`user-id-${index}`}
              type="text"
              value={userId}
              onChange={(e) => handleUserIdChange(index, e.target.value)}
              placeholder="Enter User ID"
            />
          </div>
        ))}
        <button
          className="add-button confirm-button"
          onClick={handleAddPeople}
          disabled={updating}
        >
          {updating ? "Updating..." : "Confirm and Add Members"}
        </button>
        <button
          className="cancel-button"
          onClick={() => setShowUserIdInputs(false)}
          disabled={updating}
        >
          Cancel
        </button>
      </div>
    );
  };

  return (
    <div className="whole-container">
      <div className="left-container">
        <div className="controls-container">
          <div className="selections">
            <div className="select-group">
              <label htmlFor="hostel-select">Hostel:</label>
              <select
                id="hostel-select"
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose Hostel</option>
                {hostels.map((hostel) => (
                  <option key={hostel} value={hostel}>
                    {hostel}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-group">
              <label htmlFor="room-type-select">Room Type:</label>
              <select
                id="room-type-select"
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                disabled={!selectedHostel || loading}
              >
                <option value="">Choose Room Type</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-group">
              <label htmlFor="room-id-select">Room ID:</label>
              <select
                id="room-id-select"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={!selectedRoomType || loading}
              >
                <option value="">Choose Room ID</option>
                {roomIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div className="loading">Loading...</div>}

          {!loading && selectedRoom && (
            <div className="room-info">
              <h3>Room Details</h3>
              <div className="room-info-header">
                <p><strong>Hostel:</strong> {selectedRoom.hostel || selectedHostel}</p>
                <p><strong>Room Type:</strong> {selectedRoom.roomType || selectedRoomType}</p>
                <p><strong>Room ID:</strong> {selectedRoom.id || selectedRoomId}</p>
              </div>

              <div className="room-container">
                <div className="room-stats">
                  <p>Capacity: {selectedRoom.occupancy}</p>
                  <p>Occupied: {selectedRoom.occupied}</p>
                  <p>Available: {selectedRoom.occupancy - selectedRoom.occupied}</p>
                </div>
                <div className="occupancy-container">
                  {[...Array(parseInt(selectedRoom.occupancy))].map((_, i) => (
                    <div
                      key={i}
                      className={`occupancy-block ${i < selectedRoom.occupied ? "occupied" : "available"}`}
                      title={i < selectedRoom.occupied ? "Occupied" : "Available"}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && !selectedRoomId && selectedRoomType && roomIds.length > 0 && (
            <div className="room-info">
              <h3>Available {selectedRoomType} Rooms in {selectedHostel}</h3>

              <div className="all-rooms-list">
                <div className="room-cards">
                  {roomIds.map(roomId => (
                    <div
                      key={roomId}
                      className="room-card"
                      onClick={() => setSelectedRoomId(roomId)}
                    >
                      <h4>{roomId}</h4>
                      <p>Click to select</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="right-container">
        {selectedRoom && !showUserIdInputs && (
          <div className="add-people-container">
            <h3>Add People to Room</h3>

            <div className="room-summary">
              <p><strong>Room:</strong> {selectedRoom.id || selectedRoomId}</p>
              <p><strong>Available Spaces:</strong> {selectedRoom.occupancy - selectedRoom.occupied}</p>
              {users.length > 0 && (
                <p><strong>Users Available to Add:</strong> {users.length}</p>
              )}
            </div>

            <div className="add-controls">
              <div className="input-group">
                <label htmlFor="people-count">Number of People to Add:</label>
                <input
                  id="people-count"
                  type="number"
                  min="1"
                  max={Math.min(users.length > 0 ? users.length : Number.MAX_SAFE_INTEGER, selectedRoom.occupancy - selectedRoom.occupied)}
                  value={peopleToAdd}
                  onChange={(e) => setPeopleToAdd(Number(e.target.value))}
                  disabled={updating || selectedRoom.occupied >= selectedRoom.occupancy}
                />
              </div>

              <button
                className="add-button"
                onClick={handleShowUserIdInputs}
                disabled={updating || selectedRoom.occupied >= selectedRoom.occupancy}
              >
                Continue to Add User IDs
              </button>

              {updateMessage && (
                <div className={`update-message ${updateMessage.includes("Error") || updateMessage.includes("Cannot") ? "error" : updateMessage.includes("Success") ? "success" : ""}`}>
                  {updateMessage}
                </div>
              )}
            </div>

            <div className="preview-container">
              <h4>Occupancy Preview</h4>
              {selectedRoom && (
                <div className="occupancy-preview">
                  <div className="occupancy-container preview">
                    {[...Array(parseInt(selectedRoom.occupancy))].map((_, i) => {
                      const isCurrentlyOccupied = i < selectedRoom.occupied;
                      const willBeNewlyOccupied = !isCurrentlyOccupied &&
                        i < (selectedRoom.occupied + parseInt(peopleToAdd)) &&
                        peopleToAdd > 0 &&
                        (selectedRoom.occupied + parseInt(peopleToAdd)) <= selectedRoom.occupancy;

                      return (
                        <div
                          key={i}
                          className={`occupancy-block ${isCurrentlyOccupied ? "occupied" : willBeNewlyOccupied ? "will-occupy" : "available"}`}
                          title={isCurrentlyOccupied ? "Occupied" : willBeNewlyOccupied ? "Will be occupied" : "Available"}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="preview-legend">
                    <div className="legend-item">
                      <div className="legend-color occupied"></div>
                      <span>Currently Occupied</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color will-occupy"></div>
                      <span>Will Be Occupied</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color available"></div>
                      <span>Available</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedRoom && showUserIdInputs && renderUserIdInputs()}

        {!selectedRoom && (
          <div className="no-selection">
            <h3>Add People to Room</h3>
            <p>Please select a room first to add people.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Controls;