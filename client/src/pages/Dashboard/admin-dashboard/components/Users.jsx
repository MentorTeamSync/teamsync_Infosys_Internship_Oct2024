import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, CheckCircle, XCircle, X, Trash2 } from 'lucide-react';
import { SearchBar } from './common/SearchBar';
import toast from 'react-simple-toasts';

const Users = () => {
  // State to hold the search query input by the user
  const [searchQuery, setSearchQuery] = useState('');  // State to hold the list of all users fetched from the server
  const [users, setUsers] = useState([]);         // State to hold the filtered list of users based on the search query
  const [filteredUsers, setFilteredUsers] = useState([]);  // State to indicate whether the data is currently being loaded
  const [loading, setLoading] = useState(true);     // State to hold any error messages encountered during data fetching
  const [error, setError] = useState(null);        // State to manage the visibility of the modal for user actions
  const [isModalOpen, setIsModalOpen] = useState(false);  // State to hold the currently selected user for actions
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Fetches the list of users from the server
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/all-users', {
          headers: { 'authorization': token, 'Content-Type': 'application/json' },
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

  // Handles the search functionality for filtering users
  const handleSearch = (e) => {
    e.preventDefault();
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) => user.name.toLowerCase().includes(lowerCaseQuery) || user.email.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredUsers(filtered);
  };

  // Formats the date string into a more readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Toggles the modal for user actions and sets the selected user
  const toggleModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(!isModalOpen);
  };

  // Handles the state change of a user (verified/blocked)
  const handleStateChange = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = selectedUser.id;
      const newState = selectedUser.state === 'verified' ? 'blocked' : 'verified';

      await axios.put(
        'https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/user-state',
        { user_id: userId },
        { headers: { authorization: token } }
      );

      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, state: newState } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      toast(`User ${newState === 'verified' ? 'unblocked' : 'blocked'} successfully!`);
      setIsModalOpen(false);
    } catch (error) {
      toast(error.response ? error.response.data.message : 'Something went wrong!');
    }
  };

  const handleRemove = async (user) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/user/${user.id}`, {
        headers: { 'authorization': token }
      });

      const updatedUsers = users.filter((u) => u.id !== user.id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      toast(`User "${user.name}" removed successfully.`);
    } catch (error) {
      toast(error.response ? error.response.data.message : 'Something went wrong!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4 text-center">Error: {error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Users</h1>

        <div className="flex gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <SearchBar placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-4 px-6 font-medium text-xs">Username</th>
                <th className="text-left py-4 px-6 font-medium text-xs">Email</th>
                <th className="text-left py-4 px-6 font-medium text-xs">Joined On</th>
                <th className="text-left py-4 px-6 font-medium text-xs">State</th>
                <th className="text-left py-4 px-6 font-medium text-xs">Action</th>
                <th className="text-left py-4 px-6 font-medium text-xs">Remove</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-4 px-6"><div className="font-medium text-sm">{user.name}</div></td>
                    <td className="py-4 px-6"><div className="text-sm text-gray-600">{user.email}</div></td>
                    <td className="py-4 px-6"><div className="text-sm text-gray-500">{formatDate(user.created_at)}</div></td>
                    <td className="py-4 px-6">
                      {user.state === 'verified' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleModal(user)}
                        className={`px-4 py-2 rounded-md text-white ${
                          user.state === 'verified' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {user.state === 'verified' ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleRemove(user)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg p-6 w-96 max-w-[90%] shadow-xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Confirm Action</h2>
            <p className="text-sm mb-6">
              Are you sure you want to {selectedUser?.state === 'verified' ? 'block' : 'unblock'} user <strong>{selectedUser?.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleStateChange} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
