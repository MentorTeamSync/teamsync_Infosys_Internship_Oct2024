import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, X } from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { sidebarSelection } from '../../../store/atoms/adminDashboardAtoms';

// Custom Search Bar Component
const CustomSearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="text-gray-400 w-5 h-5" />
      </div>
      <input 
        type="text" 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      {value && (
        <button 
          onClick={() => onChange({ target: { value: '' } })}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="text-gray-400 w-5 h-5" />
        </button>
      )}
    </div>
  );
};

const Notifications = () => {
  // State management for notifications data and UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const setSidebar = useSetRecoilState(sidebarSelection);

  /**
   * Effect hook to fetch notifications data when component mounts
   * Makes authenticated API call using token and user ID from localStorage
   */
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!userId) {
          throw new Error('User ID not found');
        }

        const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/comment/unread-by-project/${userId}`, {
          headers: {
            'authorization': token,
            'Content-Type': 'application/json'
          },
        });

        setNotifications(response.data);
        setFilteredNotifications(response.data);
      } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleProjectClick= async (notification) =>{
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            throw new Error('User ID not found');
        }

        const res = await axios.post(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/comment/markAsRead`,{project_id:notification.project_id} ,{
            headers: {
            'authorization': token,
            'Content-Type': 'application/json'
            },
        });

        setSidebar("project-view");
        localStorage.setItem("project_id", notification.project_id);
        localStorage.setItem("project_name", notification.project_name);
    } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
    }
  }

  // Dynamic search handler
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const filtered = notifications.filter((notification) => {
      const lowerCaseQuery = query.toLowerCase();
      return notification.project_name.toLowerCase().includes(lowerCaseQuery);
    });
    setFilteredNotifications(filtered);
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


  // Main component render with search and notifications table
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Notifications</h1>
        
        <div className="flex gap-4 mb-6">
          <CustomSearchBar
            placeholder="Search project notifications..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Notifications table with responsive scroll */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="text-left py-4 px-6 font-medium text-xs">Project Name</th>
                <th className="text-left py-4 px-6 font-medium text-xs">Unread Messages</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                    notification.unread_messages===0?<></>:
                  <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer" 
                  onClick={() => {
                    handleProjectClick(notification);
                  }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-sm">{notification.project_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{notification.unread_messages}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-500">
                    No notifications found.
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

export default Notifications;