import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MoreVertical, ChevronDown } from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';

const ArchivedProjectsTable = () => {
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch archived projects with authorization
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/get-archived-projects', {
          headers: {
            authorization: token,
            'Content-Type': 'application/json',
          },
        });

        setProjects(response.data);
        setFilteredProjects(response.data);
      } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handles project search by filtering based on name and status
  const handleSearch = (e) => {
    e.preventDefault();
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerCaseQuery) ||
        project.status.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredProjects(filtered);
  };

  return (
    <div className="pt-2 max-w-[1200px] mx-auto">
      {/* Collapsible button to toggle table visibility */}
      <div className="border rounded-lg shadow-sm">
        <button
          onClick={() => setIsTableVisible(!isTableVisible)}
          className="w-full px-6 py-4 flex items-center justify-between bg-light-blue hover:bg-gray-50 transition-colors duration-200 rounded-lg"
        >
          <div className="font-medium text-lg flex items-center gap-2">
            <span>Archived Projects</span>
            <span className="text-gray-500 text-base">
              ({filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''})
            </span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transform transition-transform duration-200 ${
              isTableVisible ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Table content, shown only when `isTableVisible` is true */}
        {isTableVisible && (
          <div className="transition-all duration-300 overflow-hidden">
            {/* Search input and search button */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-gray-300 rounded-md px-4 py-2 w-full"
                  />
                </form>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* Loading spinner or error message if data fails to load */}
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
                  {/* Table with project data */}
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b bg-gray-100 sticky" style={{ top: '-1px' }}>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Name</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">About</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Members</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Progress</th>
                        <th className="text-left py-4 px-6 font-medium text-xs bg-gray-100">Deadline</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Render projects or message if no projects are found */}
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project, index) => {
                          const formattedDeadline = new Date(project.deadline).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          });

                          return (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              {/* Project details with creator info */}
                              <td className="py-4 px-4 md:px-4 max-w-[150px] truncate">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium text-sm md:text-md line-clamp-1">{project.name}</div>
                                    <div className="text-xs text-gray-500" title={project.creator_id}>
                                      {project.creator_id.length > 16 ? project.creator_id.slice(0, 16) + '...' : project.creator_id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {/* Project status */}
                              <td className="py-4 px-6">
                                <span
                                  className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${
                                    project.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {project.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-600">
                                {project.description}
                              </td>
                              {/* Project members */}
                              <td className="py-4 px-4">
                                <div className="flex -space-x-2">
                                  {[...Array(Math.min(3, project.noUsers))].map((_, i) => (
                                    <img
                                      key={i}
                                      src={`https://i.pravatar.cc/32?img=${i + 1}`} // Fixed the URL here
                                      alt={`Member ${i + 1}`}
                                      className="w-7 h-7 rounded-full border-2 border-white"
                                    />
                                  ))}
                                  {project.noUsers > 3 && (
                                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                                      +{project.noUsers - 3}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {/* Project progress bar */}
                              <td className="py-4 px-6">
                                <ProgressBar progress={project.progress || 0} />
                              </td>
                              {/* Project deadline */}
                              <td className="py-4 ps-7 px-4">
                                <div className="text-xs text-gray-500">{formattedDeadline}</div>
                              </td>
                              {/* Options button */}
                              <td className="py-4 px-6">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <MoreVertical className="h-5 w-5 text-gray-400" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-gray-500">
                            No archived projects found.
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

export default ArchivedProjectsTable;
