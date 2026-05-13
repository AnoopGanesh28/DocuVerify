import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, File, X, CheckCircle, Loader2 } from 'lucide-react';
import { upload } from '../api';

export default function Upload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setError('');
    setSuccess('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      setError('Only PDF and TXT files are supported.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const res = await upload(file);
      setSuccess(`Successfully uploaded ${res.data.original_filename} (${res.data.chunk_count} chunks)`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0].msg);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to upload file');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-medium text-white mb-4">Upload Document</h3>
      
      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt"
            onChange={handleChange}
          />
          <UploadIcon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
          <p className="text-slate-500 text-sm mt-1">PDF or TXT up to 10MB</p>
        </div>
      ) : (
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <File className="text-blue-400 shrink-0" size={24} />
            <span className="text-slate-200 truncate font-medium">{file.name}</span>
          </div>
          {!uploading && (
            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-400 p-1 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      {error && <div className="mt-4 text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}
      {success && (
        <div className="mt-4 text-sm text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20 flex items-center">
          <CheckCircle size={16} className="mr-2 shrink-0" />
          {success}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Processing...
            </>
          ) : (
            'Process Document'
          )}
        </button>
      </div>
    </div>
  );
}
