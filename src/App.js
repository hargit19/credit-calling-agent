import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./ExcelUploader.css";

const ExcelUploader = () => {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [status, setStatus] = useState("");
  const [tableData, setTableData] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setDownloadUrl(null);
    setTableData([]);
    setTableHeaders([]);
    setStatus("File selected. Click 'Run Model' to start.");
  };

  const handleRunModel = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus("Running model...");
      const res = await fetch("https://muarata.app.n8n.cloud/webhook/6f75aa48-58c3-4785-b1e0-311a7c94be0d", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Model execution failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("Model run successful. Displaying updated data...");

      // Read and parse Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = json[0];
        const rows = json.slice(1);

        setTableHeaders(headers);
        setTableData(rows);
      };
      reader.readAsArrayBuffer(blob);
    } catch (err) {
      console.error("Error:", err);
      setStatus("Failed to run model or parse file.");
    }
  };

  return (
    <div className="excel-uploader">
      <h2>Credit Auto-Calling Agent</h2>

      <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} />
      <br /><br />

      <button onClick={handleRunModel} disabled={!file}>
        Run Model
      </button>
      <br /><br />

      {status && <p>Status: {status}</p>}

      {downloadUrl && (
        <a href={downloadUrl} download="UpdatedFile.xlsx">
          <button>Download Updated Excel</button>
        </a>
      )}

      {tableData.length > 0 && (
        <>
          <h3>📊 Updated File Preview</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {tableHeaders.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ExcelUploader;
