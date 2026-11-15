
import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { uploadBulkProducts } from '../../services/api';
import './BulkUpload.css';

const BulkUpload = () => {
  const { token } = useContext(AuthContext);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);


const handleUpload = async (event) => {
  event.preventDefault();

  if (!selectedFile) {
    setUploadError('Please select an Excel file.');
    return;
  }

  try {
    setIsUploading(true);
    setUploadError('');
    setUploadResult(null);

    const result = await uploadBulkProducts(selectedFile, token);

    setUploadResult(result);
  } catch (error) {
    setUploadError(error.message);
  } finally {
    setIsUploading(false);
  }
};


  return (
    <div className="bulk-upload-form">
  <label htmlFor="excel-file">Select Excel File</label>

  <input
    id="excel-file"
    type="file"
    accept=".xlsx"
    onChange={(event) => {
      const file = event.target.files?.[0] || null;

      setSelectedFile(file);
      setUploadError('');
      setUploadResult(null);
    }}
  />

  {selectedFile && (
    <p>Selected file: {selectedFile.name}</p>
  )}

<button
  type="button"
  onClick={handleUpload}
  disabled={isUploading || !selectedFile}
>
  {isUploading ? 'Uploading...' : 'Upload Excel File'}
</button>

{uploadError && (
  <p
    className="upload-error"
    style={{ whiteSpace: 'pre-line' }}
  >
    {uploadError}
  </p>
)}

{uploadResult && (
  <div className="upload-success">
    <p>{uploadResult.message}</p>
    <p>Products: {result.products_created}</p>
    <p>Variants: {result.variants_created}</p>
  </div>
)}

</div>
  );
};

export default BulkUpload;
