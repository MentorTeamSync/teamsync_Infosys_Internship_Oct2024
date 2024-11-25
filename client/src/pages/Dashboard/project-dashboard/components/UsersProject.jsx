import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter } from 'lucide-react';
import { SearchBar } from './common/userSearchBar';

const UsersProject = () => {
  // State management for users data and UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Effect hook to fetch users data when component mounts
   * Makes authenticated API call using token from localStorage
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/all-users-Users', {
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

  //Filters users based on name or email matching the search query
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

  // Loading state UI
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="text-red-600 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  // Main component render with search and users table
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Users</h1>
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
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-200 hover:shadow-lg transition duration-300"
            >
              <Filter className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Users table with responsive scroll */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-100">
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
        </div>
      </div>
    </div>
  );
};

export default UsersProject;