import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, User } from 'lucide-react';
import { SearchBar } from '../../project-dashboard/components/common/SearchBar';

const UserTable = () => {
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from the server
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const pid=localStorage.getItem('project_id')
        const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/get-all-users/${pid}`, {
          headers: {
            'authorization': token,
            'Content-Type': 'application/json'
          },
        });

        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("project_users", users.length);
    }
  }, [users]);
  

  const handleSearch = (e) => {
    e.preventDefault();
    const filtered = users.filter((user) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.email.toLowerCase().includes(lowerCaseQuery)
      );
    });
    setFilteredUsers(filtered);
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
        {/* Dropdown Header */}
        <button
          onClick={() => setIsTableVisible(!isTableVisible)}
          className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 rounded-lg"
        >
          <div className="font-medium text-lg flex items-center gap-2">
            <span>Project Users</span>
            <span className="text-gray-500 text-base">
              ({filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''})
            </span>
          </div>
          <ChevronDown 
            className={`h-5 w-5 transform transition-transform duration-200 ${
              isTableVisible ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsible Content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isTableVisible ? 'max-h-[800px]' : 'max-h-0'
        }`}>
          {/* Search Bar */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <SearchBar
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Table Content */}
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
              <table className="w-full">
                <thead>
                  <tr className="border-t border-b bg-gray-100">
                    <th className="text-left py-4 px-6 font-medium text-xs">Username</th>
                    <th className="text-left py-4 px-6 font-medium text-xs">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-xs">Joined On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="font-medium text-sm">{user.name}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;