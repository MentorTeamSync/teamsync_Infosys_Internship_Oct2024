import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, Download } from 'lucide-react';

const FileTable = () => {
  // State management for UI controls and data
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //fetch files with authorization
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = localStorage.getItem('token');
        const pid = localStorage.getItem('project_id');
        const response = await axios.post(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/comment/get-files`,
          { project_id: pid }, 
          {
            headers: {
              'authorization': token,
              'Content-Type': 'application/json'
            },
          });

        setFiles(response.data);
        setFilteredFiles(response.data);
      } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  useEffect(() => {
      localStorage.setItem("project_files", files.length);
  }, [files]);
  

  /**
   * Handles file download functionality
   * Converts base64 file data to blob and triggers download
   * @param {Object} file - File object containing file_data, file_type, and file_name
   */
  const handleFileDownload = async (file) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(file.file_data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.file_type });

      // Create and trigger download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  // Filters files based on file name or creator ID matching the search query
  const handleSearch = (e) => {
    e.preventDefault();
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = files.filter((file) =>
      file.file_name?.toLowerCase().includes(lowerCaseQuery) ||
      file.creator_id?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredFiles(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  return (
    <div className="pt-2 max-w-[1200px] mx-auto">
      <div className="border rounded-lg shadow-sm">
        {/* Collapsible header with file count */}
        <button
          onClick={() => setIsTableVisible(!isTableVisible)}
          className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 rounded-lg"
        >
          <div className="font-medium text-lg flex items-center gap-2">
            <span>Project Files</span>
            <span className="text-gray-500 text-base">
              ({filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''})
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transform transition-transform duration-200 ${isTableVisible ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Conditionally render the table content based on `isTableVisible` */}
        {isTableVisible && (
          <div className="transition-all duration-300 overflow-hidden">
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full"
                  />
                </form>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* Table section with loading, error, and data states */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-red-600 p-4 text-center">
                  Error: {error}
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b bg-gray-100 sticky" style={{ top: '-1px' }}>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">File Name</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Uploader</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Uploaded On</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Download</th>
                      </tr>
                    </thead>
                    {/* Table body with conditional rendering for no files found */}
                    <tbody>
                      {filteredFiles.length > 0 ? (
                        filteredFiles.map((file, index) => (
                          file.file_name &&
                          <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="font-medium text-sm">{file.file_name}</div>
                            </td>
                            <td className="py-4 px-2">
                              <div className="text-sm text-gray-600">{file.creator_id}</div>
                            </td>
                            <td className="py-4 px-8">
                              <div className="text-sm text-gray-500">
                                {formatDate(file.created_at)}
                              </div>
                            </td>
                            <td className="py-4 px-10">
                              <button 
                                onClick={() => handleFileDownload(file)}
                                className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors duration-200"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-gray-500">
                            No files found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="my-6" />
    </div>
  );
};

export default FileTable;