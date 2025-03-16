import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from 'react-router-dom';

const Ticket = () => {
    const [numberOfPeople, setNumberOfPeople] = useState("");
    const [isConfigured, setIsConfigured] = useState(false);
    const [scannedResults, setScannedResults] = useState([]);
    const [currentScan, setCurrentScan] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [currentScanCount, setCurrentScanCount] = useState(0);
    const navigate = useNavigate();
    const scannerRef = useRef(null);
    const scanningRef = useRef(false);
    const resultsRef = useRef([]);
    
    const handleRedirect = () => {
        navigate("/controls", { state: { users: scannedResults } });
    };

    const startScanning = () => {
        if (numberOfPeople <= 0) {
            alert("Please enter a valid number of people");
            return;
        }
        
        setIsConfigured(true);
        setIsScanning(true);
        scanningRef.current = true;
        setCurrentScanCount(0);
        resultsRef.current = [];
        setScannedResults([]);
        initializeScanner();
    };


    useEffect(()=>{
        if (!isScanning){

        }
    },[])
    
    const initializeScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear()
                .then(() => {
                    console.log("Previous scanner cleared");
                    scannerRef.current = null;
                    createNewScanner();
                })
                .catch((err) => {
                    console.warn("Error clearing scanner", err);
                    createNewScanner();
                });
        } else {
            createNewScanner();
        }
    };
    
    const createNewScanner = () => {
        setTimeout(() => {
            // Don't create a new scanner if we've finished scanning
            if (currentScanCount >= parseInt(numberOfPeople)) {
                setIsScanning(false);
                scanningRef.current = false;
                return;
            }
            
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: 250 },
                false
            );
            
            scannerRef.current.render(
                async (decodedText) => {
                    // If we're not actively scanning, ignore it
                    if (!scanningRef.current) {
                        return;
                    }
                    
                    // Temporarily pause scanning to prevent multiple readings of same QR code
                    scanningRef.current = false;
                    setCurrentScan(decodedText);
                    
                    // Check if this QR has already been scanned using our ref
                    if (resultsRef.current.includes(decodedText)) {
                        setVerificationStatus("⚠️ This QR code has already been scanned!");
                        // Resume scanning after a short delay
                        setTimeout(() => {
                            scanningRef.current = true;
                        }, 1500);
                        return;
                    }
                    
                    // Add to scanned results using both state and ref
                    const newResults = [...resultsRef.current, decodedText];
                    resultsRef.current = newResults;
                    setScannedResults(newResults);
                    
                    // IMPORTANT: Set the new scan count BEFORE processing it
                    const newScanCount = newResults.length;
                    setCurrentScanCount(newScanCount);
                    
                    // Verify the entry
                    await verifyEntry(decodedText, newScanCount);
                    
                    // Check if we've scanned enough people
                    if (newScanCount >= parseInt(numberOfPeople)) {
                        // We're done scanning, clean up
                        if (scannerRef.current) {
                            scannerRef.current.clear()
                                .then(() => {
                                    console.log("Scanning complete, scanner cleared");
                                    scannerRef.current = null;
                                })
                                .catch(err => console.warn("Error clearing scanner", err));
                        }
                        setIsScanning(false);
                        scanningRef.current = false;
                        setVerificationStatus("✅ All scans complete!");
                    } else {
                        // Clear the current scanner and create a new one for the next person
                        if (scannerRef.current) {
                            scannerRef.current.clear()
                                .then(() => {
                                    // Show the message for the NEXT person (newScanCount + 1)
                                    setVerificationStatus(`✅ Scan successful! Please scan person #${newScanCount + 1}`);
                                    setTimeout(() => {
                                        scanningRef.current = true;
                                        createNewScanner();
                                    }, 1000);
                                })
                                .catch((err) => {
                                    console.warn("Error clearing scanner", err);
                                    setTimeout(() => {
                                        scanningRef.current = true;
                                        createNewScanner();
                                    }, 1000);
                                });
                        }
                    }
                },
                (error) => {
                    console.warn(error);
                }
            );
        }, 100);
    };
    
    // Clean up scanner when component unmounts
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear()
                    .then(() => console.log("Scanner cleared"))
                    .catch((err) => console.warn("Error clearing scanner", err));
                scannerRef.current = null;
            }
        };
    }, []);
    
    const verifyEntry = async (qrData, scanCount) => {
        try {
            // Show a loading status while verification is happening
            setVerificationStatus("⏳ Verifying...");
            
            const response = await fetch("http://localhost:5000/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uniqueId: qrData }),
            });
            const data = await response.json();
            setVerificationStatus(data.success ? 
                `✅ Entry Verified! (${scanCount}/${numberOfPeople})` : 
                "❌ Invalid QR Code!");
        } catch (error) {
            setVerificationStatus("⚠️ Error connecting to server.");
        }
    };
    
    const resetScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear()
                .then(() => {
                    setIsConfigured(false);
                    setScannedResults([]);
                    resultsRef.current = [];
                    setCurrentScan(null);
                    setVerificationStatus("");
                    setNumberOfPeople("");
                    setIsScanning(false);
                    setCurrentScanCount(0);
                    scanningRef.current = false;
                    scannerRef.current = null;
                })
                .catch((err) => console.warn("Error clearing scanner", err));
        } else {
            setIsConfigured(false);
            setScannedResults([]);
            resultsRef.current = [];
            setCurrentScan(null);
            setVerificationStatus("");
            setNumberOfPeople("");
            setIsScanning(false);
            setCurrentScanCount(0);
        }
    };

    return (
        <div className="scanner-container">
            <h1>QR Code Scanner Cognizance Portal</h1>
            
            {!isConfigured ? (
                <div className="config-section">
                    <h2>How many people do you need to scan?</h2>
                    <input 
                        type="number" 
                        value={numberOfPeople} 
                        onChange={(e) => setNumberOfPeople(e.target.value)}
                        min="1"
                        placeholder="Enter number of people"
                        className="people-input"
                    />
                    <button className="start-btn" onClick={startScanning}>
                        Start Scanning
                    </button>
                </div>
            ) : (
                <div className="scanning-section">
                    {isScanning ? (
                        <>
                            <div id="reader" className="scanner-box"></div>
                            <h3>Scanning person {Math.min(currentScanCount + 1, parseInt(numberOfPeople))} of {numberOfPeople}</h3>
                        </>
                    ) : (
                        <div className="scanning-complete">
                            <h2>Scanning Complete!</h2>
                        </div>
                    )}
                    
                    <h3>Progress: {scannedResults.length}/{numberOfPeople}</h3>
                    
                    {currentScan && (
                        <div className="current-scan">
                            <h3>Last Scanned: <span>{currentScan}</span></h3>
                        </div>
                    )}
                    
                    <h2 className={`status-message ${
                        verificationStatus.includes("✅") ? "success" : 
                        verificationStatus.includes("❌") ? "error" : 
                        verificationStatus.includes("⏳") ? "loading" : "warning"
                    }`}>
                        {verificationStatus}
                    </h2>
                    
                    {scannedResults.length > 0 && (
                        <div className="results-section">
                            <h3>Scanned IDs:</h3>
                            <ul className="id-list">
                                {scannedResults.map((result, index) => (
                                    <li key={index} className="id-item">
                                        {index + 1}. {result}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <button className="rescan-btn" onClick={resetScanner}>
                        🔄 Reset Scanner
                    </button>
                    {!isScanning && <button className="rescan-btn" onClick={handleRedirect}>Go to Controls</button>}
                </div>
            )}
        </div>
    );
};

export default Ticket;