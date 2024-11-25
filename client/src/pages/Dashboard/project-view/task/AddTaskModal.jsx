// AddTaskModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddAssigneesModal from '../components/AddAssigneesModal';
import { FaUserPlus } from 'react-icons/fa';

// AddTaskModal component for creating a new task
const AddTaskModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('1');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [assigneesModal, setAssigneesModal] = useState({
    isOpen: false,
    taskId: null,
  });
  
  // Opens the assignees modal for a specific task
  const handleAddAssigneesClick = (taskId) => {
    setAssigneesModal({
      isOpen: true,
      taskId,
    });
  };

  // Validates the form inputs and returns any errors found
  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date();
    const minDeadline = new Date(currentDate);
    minDeadline.setDate(currentDate.getDate() + 2);

    if (!title) newErrors.title = 'Title is required';
    else if (title.length < 2) newErrors.title = 'Title must be at least 2 characters long';

    if (!description) newErrors.description = 'Description is required';
    else if (description.length < 10) newErrors.description = 'Description must be at least 10 characters long';

    if (!deadline) newErrors.deadline = 'Deadline is required';
    else if (new Date(deadline) < minDeadline) {
      newErrors.deadline = 'Deadline must be at least 2 days from today';
    }

    return newErrors;
  };

  // Handles input changes and clears any associated errors
  const handleInputChange = (e, setFieldValue, fieldName) => {
    const { value } = e.target;
    setFieldValue(value);
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: '' })); // Clear error for the field
  };

  // Submits the form data to create a new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    const projectId = localStorage.getItem('project_id');
    const token = localStorage.getItem('token');
    const creatorId = localStorage.getItem('userEmail');
    const project_name = localStorage.getItem('project_name');

    try {
      const response = await axios.post(
        `https://teamsync-infosys-internship-oct2024-9gij.vercel.app/task/project/${projectId}/create-task`,
        {
          title,
          description,
          deadline,
          status: '0',
          priority,
          creator_id: creatorId,
          project_name,
        },
        {
          headers: { authorization: token },
        }
      );

      if (response.status === 201) {
        toast.success('Task created successfully!');
        setTitle('');
        setDescription('');
        setDeadline('');
        setPriority('1');
        onClose();
      }
    } catch (error) {
      const { status } = error.response;
      if (status === 400) toast.error('Invalid task data. Please check the details.');
      else if (status === 404) toast.error('Project not found.');
      else if (status === 500) toast.error('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <ToastContainer />
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
          onClick={onClose}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-700 shadow-2xl font-semibold text-4xl"
            >
              &times;
            </button>
            <form onSubmit={handleSubmit}>
              {/* Task Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleInputChange(e, setTitle, 'title')}
                  className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded`}
                  placeholder="Enter task title"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => handleInputChange(e, setDescription, 'description')}
                  className={`w-full p-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded`}
                  placeholder="Enter task description"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Deadline */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => handleInputChange(e, setDeadline, 'deadline')}
                  className={`w-full p-2 border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} rounded`}
                />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="0">Low</option>
                  <option value="1">Medium</option>
                  <option value="2">High</option>
                </select>
              </div>

              {/* Add Assignee Button */}
              <div className="mb-4 flex justify-end">
                  <button
                      type="button"
                      onClick={() => handleAddAssigneesClick(' ')}
                      className="text-blue-950 hover:text-blue-900 transition-colors"
                      title="Add Assignee"
                  >
                    <FaUserPlus size={24} />
                  </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-950 text-white rounded hover:bg-blue-900 transition-colors"
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AddAssigneesModal
        isOpen={assigneesModal.isOpen}
        onClose={() => setAssigneesModal({ isOpen: false, taskId: null })}
        taskId={assigneesModal.taskId}
        onSuccess={() => {

        }}
      />
    </>
  );
};

export default AddTaskModal;