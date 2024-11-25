import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Filter, Edit3, ChevronDown, ChevronRight, X, Trash2, PlusCircle } from 'lucide-react';
import { z } from 'zod';
import AddAssigneesModal from '../project-view/components/AddAssigneesModal';

// Toast component for displaying success or error messages
const Toast = ({ message, type, onClose }) => { 
  // Automatically close the toast after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
 // Define the background color based on the type of message
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      {message}
    </div>
  );
};
// Schema for validating the task details using Zod
const EditTaskDetailsSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters long' }).optional(),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }).optional(),
  priority: z.enum(['0', '1', '2'], { 
      message: 'Priority must be 0 (low), 1 (medium), or 2 (high)'
  }).optional(),
  deadline: z.string().optional(),
  status: z.enum(['0', '1', '2'], { 
      message: 'Status must be 0 (to do), 1 (in progress), or 2 (completed)'
  }).optional(),
}).refine(data => Object.values(data).some(value => value !== undefined && value !== ''), {
  message: 'At least one field (title, description, priority, deadline, or status) must be provided'
});
// Modal for confirming task deletion
const DeleteModal = ({ isOpen, onClose, onConfirm, taskTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg p-6 w-96 max-w-[90%] shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Delete Task</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
// Modal for editing task details
const EditModal = ({ isOpen, onClose, task, onSave }) => {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [errors, setErrors] = useState({});
  const [isFormChanged, setIsFormChanged] = useState(false);
// Update the modal form when the task data changes
  useEffect(() => {
      if (task) {
          setEditedTask({ ...task });
      }
  }, [task]);
// Handle form field changes
  const handleChange = (e) => {
      const { name, value } = e.target;
      setEditedTask((prevTask) => {
          const updatedTask = { ...prevTask, [name]: value };
          validateForm(updatedTask);// Validate the updated form
          setIsFormChanged(JSON.stringify(updatedTask) !== JSON.stringify(task)); // Check if the form has changes
          return updatedTask;
      });
  };
// Validate the form using Zod schema
  const validateForm = (formData) => {
      try {
          EditTaskDetailsSchema.parse(formData);
          setErrors({});
      } catch (error) {
          if (error instanceof z.ZodError) {
              const fieldErrors = {};
              error.errors.forEach((err) => {
                  fieldErrors[err.path[0]] = err.message;
              });
              setErrors(fieldErrors);
          }
      }
  };
// Save the edited task if validation passes
  const handleSave = () => {
      if (Object.keys(errors).length === 0 && isFormChanged) {
          onSave(editedTask);
      } else {
          setErrors({ ...errors, form: 'Please correct errors or make a change before saving' });
      }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={onClose}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg p-6 w-96 max-w-[90%] shadow-xl">
              <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                  <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input 
                      type="text"
                      name="title"
                      value={editedTask.title || ''}
                      onChange={handleChange}
                      className="mt-1 px-3 py-2 border rounded-md w-full"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                      name="description"
                      value={editedTask.description || ''}
                      onChange={handleChange}
                      className="mt-1 px-3 py-2 border rounded-md w-full"
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input 
                      type="date"
                      name="deadline"
                      value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().split('T')[0] : ''}
                      onChange={handleChange}
                      className="mt-1 px-3 py-2 border rounded-md w-full"
                  />
                  {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>

              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                      name="priority"
                      value={editedTask.priority || ''}
                      onChange={handleChange}
                      className="mt-1 px-3 py-2 border rounded-md w-full"
                  >
                      <option value="">Select Priority</option>
                      <option value="0">Low</option>
                      <option value="1">Medium</option>
                      <option value="2">High</option>
                  </select>
                  {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
              </div>

              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                      name="status"
                      value={editedTask.status || ''}
                      onChange={handleChange}
                      className="mt-1 px-3 py-2 border rounded-md w-full"
                  >
                      <option value="">Select Status</option>
                      <option value="0">To Do</option>
                      <option value="1">In Progress</option>
                      <option value="2">Completed</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>

              {errors.form && <p className="text-red-500 text-xs mt-2">{errors.form}</p>}

              <div className="flex justify-end gap-3">
                  <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                      Save
                  </button>
              </div>
          </div>
      </div>
  );
};

const MyTasksTable = ({ type = 'assigned' }) => { 
// State to manage the list of all tasks fetched from the server
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);// State to store tasks after applying filters (e.g., search query or other criteria)
  const [loading, setLoading] = useState(true);// Loading indicator to display a spinner or message while tasks are being fetched
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());// State to manage which project rows are expanded in the UI (if tasks are grouped by project)
  // State to manage the delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: '',
    project_id:''
  });
  // State to manage the assignees modal
  const [assigneesModal, setAssigneesModal] = useState({
    isOpen: false,
    taskId: null
  });
   // Function to handle clicks for adding assignees to a specific task
  // It sets the `assigneesModal` state to open and assigns the task ID
  const handleAddAssigneesClick = (taskId) => {
    setAssigneesModal({
      isOpen: true,
      taskId
    });
  };
  
// Function to display a toast notification
  const showToast = (message, type) => {
      // Updates the toast state with a message and type (e.g., success or error)
    setToast({ message, type });
  };
  // State to manage the Edit Task modal visibility and content
  const [editModal, setEditModal] = useState({
    isOpen: false,// Tracks whether the modal is open or closed
    task: null // Holds the task object being edited, or null if no task is selected
  });
  
  // Create axios instance with default config
  const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
      'Authorization': localStorage.getItem('token')
    }
  });
// Effect hook to fetch tasks whenever the 'type' prop changes
  useEffect(() => {
    fetchTasks();
  }, [type]);
// Function to handle when the Delete button is clicked for a task
  const handleDeleteClick = (taskId, taskTitle, taskProjectId) => {
    if (!taskId) {
      // Ensure that a valid task ID is provided
      console.error('No task ID provided');
      showToast("Error: Unable to delete task", "error");
      return;
    }
    
    setDeleteModal({ 
      // Update the state to open the delete modal with the selected task details
      isOpen: true,
      taskId,
      taskTitle,
      project_id:taskProjectId
    });
  };
// Function to confirm task deletion

  const handleDeleteConfirm = useCallback(async () => {
    const taskId = deleteModal.taskId;
    try {
      const projectId = deleteModal.project_id;
      // Send a DELETE request to the API to remove the task
      await api.delete(`/task/project/${projectId}/delete-task`, {
        data: { task_id: taskId }
      });
      // Update the tasks state to remove the deleted task
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      // Also update the filtered tasks state, in case a filter is applied
      setFilteredTasks(prevFilteredTasks => prevFilteredTasks.filter(task => task.id !== taskId));
      // Display a success toast notification
      showToast("Task deleted successfully", "success");
    } catch (error) {
      console.error('Delete task error:', error);
      showToast("Failed to delete task", "error");
    } finally {
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' });
    }
  }, [deleteModal.taskId]);
// Function to fetch tasks from the server
  const fetchTasks = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail');
      
      let response;
      if (type === 'assigned') {
        response = await axios.get(
          `https://teamsync-infosys-internship-oct2024-9gij.vercel.app/task/user/${userId}/assigned-tasks`,
          {
            headers: {
              'authorization': token,
            }
          }
        );
      } else {
        response = await axios.get(
          `https://teamsync-infosys-internship-oct2024-9gij.vercel.app/task/user/${userEmail}/created-tasks`,
          {
            headers: {
              'authorization': token,
            }
          }
        );
      }
      
      // Sort tasks by project, priority, and deadline
      const sortedTasks = response.data.sort((a, b) => {
        // First sort by project_id
        const projectCompare = a.project_id.localeCompare(b.project_id);
        if (projectCompare !== 0) return projectCompare;
        
        // Then sort by priority (high to low)
        const priorityCompare = b.priority.localeCompare(a.priority);
        if (priorityCompare !== 0) return priorityCompare;
        
        // Finally sort by deadline
        return new Date(a.deadline) - new Date(b.deadline);
      });

      setTasks(sortedTasks);
      setFilteredTasks(sortedTasks);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showToast("Failed to fetch tasks", "error");
    }
  };
  const handleEditClick = (task) => {
    setEditModal({
      isOpen: true,
      task
    });
  };
  
// Function to handle saving the edited task details
  const handleEditSave = async (editedTask) => {
    try {
      // Send a PUT request to update the task with the provided edited details
      await api.put(`/task/${editedTask._id}/edit-details`, editedTask);
      const updatedTasks = tasks.map((task) =>
        task._id === editedTask._id ? editedTask : task
      ); 
      // Update both the tasks and filteredTasks state to reflect the changes
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);
      showToast("Task updated successfully", "success");
    } catch (error) {
      console.error('Edit task error:', error);
      showToast("Failed to update task", "error");
    } finally {
      setEditModal({ isOpen: false, task: null });
    }
  };
// Function to handle task search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    // Filter the tasks based on the search query (case-insensitive search)
    const filtered = tasks.filter((task) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(lowerCaseQuery) ||
        task.description.toLowerCase().includes(lowerCaseQuery) ||
        task.project_name.toLowerCase().includes(lowerCaseQuery)
      );
    });
    // Update the filteredTasks state to reflect the filtered results
    setFilteredTasks(filtered);
  };
// Function to toggle the expanded/collapsed state of a project (used for project details or collapsible lists)
  const toggleProject = (projectId) => {
    // Create a copy of the existing set of expanded project IDs
    const newExpanded = new Set(expandedProjects);
    // If the project ID is already in the set, remove it to collapse the project
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };
// Function to format a date string into a human-readable format (dd/mm/yy)
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };
// Function to return different styling based on the task's status value
  const getStatusStyle = (status) => {
    switch (status) {
      case "0": return "bg-gray-100 text-gray-800";
      case "1": return "bg-blue-100 text-blue-800";
      case "2": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
// Function to return a CSS class based on the task's priority value
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "0": return "bg-blue-100 text-blue-800";
      case "1": return "bg-yellow-100 text-yellow-800";
      case "2": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
// Function to return the status text based on the task's status value
  const getStatusText = (status) => {
    switch (status) {
      case "0": return "To Do";
      case "1": return "In Progress";
      case "2": return "Completed";
      default: return "Unknown";
    }
  };
// Function to return the priority text based on the task's priority value
  const getPriorityText = (priority) => {
    switch (priority) {
      case "0": return "Low";
      case "1": return "Medium";
      case "2": return "High";
      default: return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Group tasks by project
  const tasksByProject = filteredTasks.reduce((acc, task) => {
    const projectId = task.project_id;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {});

  return (
    <div className="py-6 max-w-[1200px] mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
       <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, task: null })}
        task={editModal.task}
        onSave={handleEditSave}
      />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' })}
        onConfirm={handleDeleteConfirm}
        taskTitle={deleteModal.taskTitle}
      />
      <AddAssigneesModal
        isOpen={assigneesModal.isOpen}
        onClose={() => setAssigneesModal({ isOpen: false, taskId: null })}
        taskId={assigneesModal.taskId}
        onSuccess={fetchTasks}
      />

      <form onSubmit={handleSearch} className="flex justify-between items-center mb-8">
        <div className="hidden lg:block font-medium text-lg">{type === 'assigned' ? 'Tasks assigned to you' : 'Tasks created by you'}</div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-200 hover:shadow-lg transition duration-300">
            <Filter className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {Object.entries(tasksByProject).map(([projectId, projectTasks]) => (
          <div key={projectId} className="border rounded-lg overflow-hidden">
            <div
              className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleProject(projectId)}
            >
              <div className="flex items-center gap-2">
                {expandedProjects.has(projectId) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <h3 className="font-medium">{projectTasks[0].project_name}</h3>
                <span className="text-sm text-gray-500">({projectTasks.length} tasks)</span>
              </div>
            </div>

            {expandedProjects.has(projectId) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="text-left py-4 px-6 font-medium text-xs">Task</th>
                      <th className="text-left py-4 px-6 font-medium text-xs">Description</th>
                      <th className="text-left py-4 px-6 font-medium text-xs">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-xs">Priority</th>
                      <th className="text-left py-4 px-6 font-medium text-xs">Created</th>
                      <th className="text-left py-4 px-6 font-medium text-xs">Deadline</th>
                      <th className="w-10"></th>
                      <th className="w-10"></th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTasks.map((task) => (
                      <tr key={task._id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{task.title}</span>
                            <span className="text-xs text-gray-500">{task.creator_id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-[200px] truncate text-sm" title={task.description}>
                            {task.description}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(task.status)} truncate max-w-[100px]`}>
                            {getStatusText(task.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${getPriorityStyle(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs text-gray-500">{formatDate(task.created_at)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-xs text-gray-500">{formatDate(task.deadline)}</div>
                        </td>
                        <td className="py-4 px-2">
                          <button 
                            onClick={() => handleDeleteClick(task.id, task.title, task.project_id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors duration-200"
                            title="Delete task"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditClick(task)} 
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit task"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-4 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => handleAddAssigneesClick(task.id)} 
                                className="text-blue-500 hover:text-blue-700" title='Add assignees'
                              >
                                <PlusCircle className="h-5 w-5" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyTasksTable;
