import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Edit3, Trash2, X, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import {z} from "zod"
import AddAssigneesModal from '../components/AddAssigneesModal';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer); 
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  );
};

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

const EditModal = ({ isOpen, onClose, task, onSave }) => {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [errors, setErrors] = useState({});
  const [isFormChanged, setIsFormChanged] = useState(false);

  useEffect(() => {
      if (task) {
          setEditedTask({ ...task });
      }
  }, [task]);

  const handleChange = (e) => {
      const { name, value } = e.target;
      setEditedTask((prevTask) => {
          const updatedTask = { ...prevTask, [name]: value };
          validateForm(updatedTask);
          setIsFormChanged(JSON.stringify(updatedTask) !== JSON.stringify(task)); // Check if the form has changes
          return updatedTask;
      });
  };

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



const TaskTable = ({ refreshTrigger }) => {
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    task: null
  });
  const [assigneesModal, setAssigneesModal] = useState({
    isOpen: false,
    taskId: null
  });
  const handleAddAssigneesClick = (taskId) => {
    setAssigneesModal({
      isOpen: true,
      taskId
    });
  };


  // Create axios instance with default config
  const api = axios.create({
    baseURL: 'https://teamsync-infosys-internship-oct2024-9gij.vercel.app',
    headers: {
      'Authorization': localStorage.getItem('token')
    }
  });

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

 const handleDeleteClick = (taskId, taskTitle) => {
  if (!taskId) {
    console.error('No task ID provided');
    showToast("Error: Unable to delete task", "error");
    return;
  }
  
  setDeleteModal({
    isOpen: true,
    taskId,
    taskTitle
  });
};
  const handleEditClick = (task) => {
    setEditModal({
      isOpen: true,
      task
    });
  };
  

  const handleEditSave = async (editedTask) => {
    try {
      await api.put(`/task/${editedTask._id}/edit-details`, editedTask);
      const updatedTasks = tasks.map((task) =>
        task._id === editedTask._id ? editedTask : task
      );
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


  const handleDeleteConfirm = useCallback(async () => {
    const taskId = deleteModal.taskId;
    try {
      const projectId = localStorage.getItem('project_id');
      
      await api.delete(`/task/project/${projectId}/delete-task`, {
        data: { task_id: taskId }
      });
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      setFilteredTasks(prevFilteredTasks => prevFilteredTasks.filter(task => task.id !== taskId));
      
      showToast("Task deleted successfully", "success");
    } catch (error) {
      console.error('Delete task error:', error);
      showToast("Failed to delete task", "error");
    } finally {
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' });
    }
  }, [deleteModal.taskId]);
  
  

  const fetchTasks = async () => {
    try {
      const projectId = localStorage.getItem('project_id');
      
      const { data } = await api.get(`/task/project/${projectId}/view-tasks`);
      
      // Filter out completed tasks (status "2")
      const nonCompletedTasks = data.filter(task => task.status !== "2");
  
      setTasks(nonCompletedTasks);
      setFilteredTasks(nonCompletedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setLoading(false);
      showToast("Failed to fetch tasks", "error");
    }
  };
  

  // Rest of the component remains exactly the same
  const handleSearch = (e) => {
    e.preventDefault();
    const filtered = tasks.filter((task) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(lowerCaseQuery) ||
        task.description.toLowerCase().includes(lowerCaseQuery)
      );
    });
    setFilteredTasks(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "0": return "bg-gray-100 text-gray-800";
      case "1": return "bg-blue-100 text-blue-800";
      case "2": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "0": return "bg-blue-100 text-blue-800";
      case "1": return "bg-yellow-100 text-yellow-800";
      case "2": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "0": return "To Do";
      case "1": return "In Progress";
      case "2": return "Completed";
      default: return "Unknown";
    }
  };

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

  const TableHeader = () => (
    <tr className="border-b bg-gray-100">
      <th className="text-left py-4 px-6 font-medium text-xs">Task</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Description</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Status</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Priority</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Assignees</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Created</th>
      <th className="text-left py-4 px-6 font-medium text-xs">Deadline</th>
      <th className="w-10"></th>
    </tr>
  );

  return (
    <div className="py-6 max-w-[1200px] mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' })}
        onConfirm={handleDeleteConfirm}
        taskTitle={deleteModal.taskTitle}
      />
       <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, task: null })}
        task={editModal.task}
        onSave={handleEditSave}
      />
      <AddAssigneesModal
        isOpen={assigneesModal.isOpen}
        onClose={() => setAssigneesModal({ isOpen: false, taskId: null })}
        taskId={assigneesModal.taskId}
        onSuccess={fetchTasks}
      />


      {/* Dropdown Header */}
      <div className="border rounded-lg shadow-sm">
        <button
          onClick={() => setIsTableVisible(!isTableVisible)}
          className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 rounded-lg"
        >
          <div className="font-medium text-lg flex items-center gap-2">
            <span>Tasks</span>
            <span className="text-gray-500 text-base">
              ({filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''})
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
          <form onSubmit={handleSearch} className="px-6 py-4 border-t border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search tasks..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b bg-gray-100">
                  <th className="text-left py-4 px-6 font-medium text-xs">Task</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Description</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Priority</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Assignees</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Created</th>
                  <th className="text-left py-4 px-6 font-medium text-xs">Deadline</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="flex justify-center items-center h-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task._id} className="border-b last:border-b-0 hover:bg-gray-50">
                      {/* Table row content remains the same */}
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
                         <span className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${getStatusStyle(task.status)}truncate max-w-[100px]`}>
                          {getStatusText(task.status)}
                         </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${getPriorityStyle(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((_, i) => (
                            <img
                              key={i}
                              src={`https://i.pravatar.cc/32?img=${i + 1}`}
                              alt={`Assignee ${i + 1}`}
                              className="w-7 h-7 rounded-full border-2 border-white"
                            />
                          ))}
                          {task.assignees.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs text-gray-500">{formatDate(task.created_at)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs text-gray-500">{formatDate(task.deadline)}</div>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleDeleteClick(task.id, task.title)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors duration-200"
                            title="Delete task"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(task)} 
                            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors duration-200"
                            title="Edit task"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleAddAssigneesClick(task.id)} 
                            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors duration-200"
                            title="Add assignees"
                          >
                            <PlusCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">No tasks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTable;
