import React, { useState, useRef, useEffect } from 'react';
import {  Plus, X, Loader, Edit3 } from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSetRecoilState } from 'recoil';
import { sidebarSelection } from '../../../../../store/atoms/adminDashboardAtoms';

export const ProjectRow = ({ project, isCreatedProject = false }) => {
  const setSidebar = useSetRecoilState(sidebarSelection);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState(project.status);
  const [updatedAbout, setUpdatedAbout] = useState(project.description);
  const [progress, setProgress] = useState(0);
  const [updatedDeadline, setUpdatedDeadline] = useState(
    project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '' // Set deadline in YYYY-MM-DD format
  );
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  const addUserModalRef = useRef(null); 
   // Validation flag to check if at least one field is changed
   const [isChanged, setIsChanged] = useState(false);

   useEffect(() => {
     // Check if any field has been modified
     const hasChanged = 
       updatedStatus !== project.status ||
       updatedAbout !== project.description ||
       updatedDeadline !== (project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
 
     setIsChanged(hasChanged);
   }, [updatedStatus, updatedAbout, updatedDeadline, project]);



  const formattedDeadline = project.deadline ? new Date(project.deadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }) : 'No deadline';

  // Add useEffect to fetch members when component mounts
  useEffect(() => {
    fetchMembers();
  }, [project.id]); // Add project.id as dependency

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-200 text-red-800';
    }
  };

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setIsDropdownOpen(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);

  useEffect(() => {
    const handleClickOutsideModal = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsEditModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideModal);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideModal);
    };
  }, [isEditModalOpen]);

  useEffect(() => {
    const handleClickOutsideAddUserModal = (event) => {
      if (addUserModalRef.current && !addUserModalRef.current.contains(event.target)) {
        setIsModalOpen(false);
        setSelectedUsers([]);
        setSearchTerm('');
      }
    };
  
    document.addEventListener('mousedown', handleClickOutsideAddUserModal);
    return () => document.removeEventListener('mousedown', handleClickOutsideAddUserModal);
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/project/get-all-users/${project.id}`, {
        headers: { authorization: token },
      });
      setMembers(response.data);
    } catch (error) {
      toast.error('Error fetching members. Please try again later.');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/admin/all-users-Users', {
        headers: { authorization: token }
      });
      
      // Get existing project members
      const projectMembersResponse = await axios.get(`http://localhost:3001/project/get-all-users/${project.id}`, {
        headers: { authorization: token },
      });
      
      // Create a set of existing member IDs for efficient lookup
      const existingMemberIds = new Set(projectMembersResponse.data.map(member => member.id));
      
      // Mark users as disabled if they're already members
      const processedUsers = response.data.map(user => ({
        ...user,
        isDisabled: existingMemberIds.has(user.id)
      }));
      
      setUsers(processedUsers);
    } catch (error) {
      toast.error('Error fetching users. Please try again later.');
    }
  };

  const handleAddUsers = async () => {
    if (!project.is_approved) {
      toast.warning('Please verify the project first and then try adding users.');
      return;
    }
    setIsModalOpen(true);
    fetchUsers();
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        project_id: project.id,
        description: updatedAbout,
        status: updatedStatus,
        user_ids: selectedUsers.map(user => user.id)
      };
  
      if (updatedDeadline) {
        dataToSend.deadline = updatedDeadline;
      }
      await axios.post('http://localhost:3001/project/addUsers', dataToSend
        ,
        {
          headers: { Authorization: token }
        }
      );
      
      toast.success('Users added successfully!');
      setIsModalOpen(false);
      setSelectedUsers([])
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Error adding users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeUser = (userToRemove) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userToRemove.id));
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectClick = () => {
    setSidebar("project-view");
    localStorage.setItem("project_id", project.id);
    localStorage.setItem("project_name", project.name);
    localStorage.setItem("project_description", project.description);
    localStorage.setItem("project_deadline", project.deadline);
    localStorage.setItem("project_status", project.status);
    localStorage.setItem("project_priority", project.priority);
    localStorage.setItem("project_creator", project.creator_id);
    localStorage.setItem("project_tags", project.tags);
  };

  const handleEditSubmit = async () => {
    if (!isChanged) {
      toast.error('Please change at least one field before submitting.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put('http://localhost:3001/project/update', 
        {
          project_id: project.id,
          description: updatedAbout,
          deadline: updatedDeadline,
          status: updatedStatus
        },
        {
          headers: { Authorization: token }
        }
      );
      toast.success('Project updated successfully!');
      setIsEditModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Error updating project. Please try again later.');
    }
  };

  useEffect(() => {
    const fetchCompletionPercentage = async () => {
      const projectid=localStorage.getItem('project_id')
      try {
        const response = await axios.get(`http://localhost:3001/project/completion-percentage/${projectid}`);
        const completionPercentage = parseFloat(response.data.completion_percentage || 0).toFixed(2);
        setProgress(completionPercentage);
      } catch (error) {
        console.error('Error fetching completion percentage:', error);
      }
    };

    fetchCompletionPercentage();
  }, []);


  return (
    <>
      <ToastContainer />
      
      <tr className="border-b last:border-b-0 hover:bg-gray-50">
  <td className="py-3 px-2 md:px-4 max-w-[150px] truncate">
    <div className="flex items-center gap-2">
      <div className="cursor-pointer" onClick={handleProjectClick}>
        <div className="font-medium text-xs md:text-sm line-clamp-1">
          {project.name}
        </div>
        <div className="text-xs text-gray-500">{project.creator_id}</div>
      </div>
    </div>
  </td>
  <td className="py-3 px-2 text-xs md:text-sm">
    <span
      className={`inline-flex justify-center items-center px-2 py-1 rounded-full ${project.is_approved ? getStatusStyle(project.status) : getStatusStyle("")}`}
    >
      {project.is_approved ? project.status : "Not approved"}
    </span>
  </td>
  <td className="py-3 px-2 md:px-4 text-xs md:max-w-[200px] md:truncate md:table-cell">
    <div className="md:hidden"></div>
    <div>{project.description}</div>
  </td>
  <td className="py-3 px-2 md:px-4">
    <div className="flex -space-x-2 relative" title={`${members.length} members`}>
      {members.slice(0, 3).map((member, index) => (
        <div key={member.id} className="relative" style={{ zIndex: members.length - index }}>
          <img
            src={`https://i.pravatar.cc/32?img=${index + 1}`}
            alt={member.name}
            className="w-7 h-7 rounded-full border-2 border-white object-cover"
          />
        </div>
      ))}
      {members.length > 3 && (
        <div
          className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600 relative"
          style={{ zIndex: 0 }}
        >
          +{members.length - 3}
        </div>
      )}
    </div>
  </td>
  <td className="py-3 px-2 md:px-4">
    <ProgressBar progress={progress || 0} />
  </td>
  <td className="py-3 ps-5 px-2 md:px-4 text-xs text-gray-500">
    {formattedDeadline}
  </td>
  <td className="py-3 px-2 md:px-4">
    <span
      className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${getPriorityStyle(project.priority)}`}
    >
      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
    </span>
  </td>
  <td className="py-3 px-2 relative" ref={dropdownRef}>
    {isCreatedProject && (
      <div className="flex gap-1">
        <button className="p-2 hover:bg-blue-50 rounded-full cursor-pointer" onClick={handleAddUsers}>
          <Plus className="w-4 h-4 text-green-500" />
        </button>
        <button className="p-2 hover:bg-blue-50 rounded-full cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
          <Edit3 className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    )}
  </td>
</tr>


      {/* User Addition Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={addUserModalRef} className="bg-white rounded-lg p-6 w-[425px] max-w-full mx-4 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Add Users</h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedUsers([]);
                    setSearchTerm('');
                  }} 
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Users List */}
              <div className="flex-grow overflow-y-auto mb-4 border rounded-md">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div 
                      key={user.id} 
                      className={`flex justify-between items-center p-3 border-b last:border-b-0 transition-colors ${
                        user.isDisabled ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-medium ${user.isDisabled ? 'text-gray-500' : 'text-gray-700'}`}>
                          {user.name}
                        </span>
                        <span className={`text-sm ${user.isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </span>
                        {user.isDisabled && (
                          <span className="text-xs text-gray-500 italic mt-1">
                            Already a member
                          </span>
                        )}
                      </div>
                      {user.isDisabled ? (
                        <span className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-md">
                          Added
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (!selectedUsers.some(selected => selected.id === user.id)) {
                              setSelectedUsers([...selectedUsers, user]);
                            }
                          }}
                          disabled={selectedUsers.some(selected => selected.id === user.id)}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${
                            selectedUsers.some(selected => selected.id === user.id)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {selectedUsers.some(selected => selected.id === user.id) ? 'Selected' : 'Add'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No users found matching your search.
                  </div>
                )}
              </div>

              {/* Selected Users Section */}
              {selectedUsers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Users ({selectedUsers.length})</h4>
                  <div className="border rounded-md max-h-[150px] overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{user.name}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                        <button
                          onClick={() => removeUser(user)}
                          className="text-red-600 hover:text-red-700 text-sm px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                  selectedUsers.length > 0
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSubmit}
                disabled={isLoading || selectedUsers.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    <span>Adding Users...</span>
                  </div>
                ) : (
                  `Add ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        )}
{/*Edit project modal */}
{isEditModalOpen && (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
    <div ref={modalRef} className="bg-white p-6 rounded-md shadow-lg w-11/12 max-w-md relative">
      
      <button
        onClick={() => setIsEditModalOpen(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      
      <h2 className="text-xl font-semibold mb-4 pr-8">Edit Project</h2>
      <label className="block mb-2">
        Description
        <input
          type="text"
          value={updatedAbout}
          onChange={(e) => setUpdatedAbout(e.target.value)}
          className="border rounded w-full p-2 mt-1"
        />
      </label>
      <label className="block mb-2">
        Status
        <select
          value={updatedStatus}
          onChange={(e) => setUpdatedStatus(e.target.value)}
          className="border rounded w-full p-2 mt-1 bg-white"
        >
          <option value="active">Active</option>
          <option value="reviewing">Reviewing</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="block mb-2">
        Deadline
        <input
          type="date"
          value={updatedDeadline}
          onChange={(e) => setUpdatedDeadline(e.target.value)}
          className="border rounded w-full p-2 mt-1"
        />
      </label>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleEditSubmit}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
};
