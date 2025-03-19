import React, { useState } from "react";

const ExcelUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus("Please select an Excel file!");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      setStatus("Uploading and processing...");
      const response = await fetch("http://localhost:5000/upload-excel", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        setStatus(
          `Success: ${result.successCount} emails sent, Failed: ${result.failureCount}, Total: ${result.total}`
        );
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Failed to upload: ${error.message}`);
    }
  };
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Upload Participants Excel</h1>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Upload & Send Emails
        </button>
      </form>
      {status && (
        <p style={{ marginTop: "20px", color: status.includes("Error") || status.includes("Failed") ? "red" : "green" }}>
          {status}
        </p>
      )}
    </div>
  );
};

export default ExcelUpload;