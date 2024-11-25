import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { X } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

//
// Functional component for adding a new project
const AddProjectModal = ({ isOpen, onClose }) => {
  // State variables for project details and validation
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({
    projectName: false,
    projectDescription: false,
    deadline: false,
    priority: false,
    tags: false,
  });

  // Effect to validate project name when touched
  useEffect(() => {
    if (touched.projectName) validateProjectName(projectName);
  }, [projectName, touched.projectName]);

  // Effect to validate project description when touched
  useEffect(() => {
    if (touched.projectDescription) validateProjectDescription(projectDescription);
  }, [projectDescription, touched.projectDescription]);

  // Effect to validate deadline when touched
  useEffect(() => {
    if (touched.deadline) validateDeadline(deadline);
  }, [deadline, touched.deadline]);

  // Effect to validate tags when touched
  useEffect(() => {
    if (touched.tags) validateTags(tags);
  }, [tags, touched.tags]);

  // Asynchronous function to check if a project name already exists
  const checkProjectNameExists = async (name) => {
    try {
      const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/check-name?name=${name}`);
      return response.data.exists;
    } catch (error) {
      console.error('Error checking project name:', error);
      return false;
    }
  };

  // Handles the key down event for tag input
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      
      // Validate tag length
      if (newTag.length < 2) {
        setErrors(prev => ({ ...prev, tags: 'Tags must be at least 2 characters long' }));
        return;
      }
      
      // Check for duplicate tags
      if (tags.includes(newTag)) {
        setErrors(prev => ({ ...prev, tags: 'This tag already exists' }));
        return;
      }

      setTags(prev => [...prev, newTag]);
      setTagInput('');
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  // Removes a tag from the list of tags
  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Handles the form submission for creating a new project
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setTouched({
      projectName: true,
      projectDescription: true,
      deadline: true,
      priority: true,
      tags: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      try {
        const projectNameExists = await checkProjectNameExists(projectName);
        if (projectNameExists) {
          toast.error('A project with this name already exists. Please choose a different name.');
          return;
        }
        const token = localStorage.getItem('token');
        const formattedDeadline = formatDeadline(deadline);
        const projectData = {
          name: projectName,
          description: projectDescription,
          deadline: formattedDeadline,
          priority,
          tags
        };

        const response = await axios.post('https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/create', projectData, {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          toast.success('Project created successfully!');
          onClose();
          window.location.reload();
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 400 && error.response.data.message) {
            if (error.response.data.message.includes('same name')) {
              toast.error('A project with this name already exists. Please try another name.');
            } else {
              toast.error('There was an issue with your project details. Please check and try again.');
            }
          } else if (error.response.status === 401) {
            toast.error('Unauthorized! Please log in again.');
          } else if (error.response.status === 500) {
            toast.error('Internal server error! Please try again later.');
          }
        } else {
          toast.error('An unexpected error occurred!');
        }
      }
    }
  };

  // Formats the deadline date from YYYY-MM-DD to DD/MM/YYYY
  const formatDeadline = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  // Validates the project name for minimum length
  const validateProjectName = (name) => {
    if (name.length < 4) {
      setErrors(prev => ({ ...prev, projectName: 'Project name must be at least 4 characters long' }));
    } else {
      setErrors(prev => ({ ...prev, projectName: undefined }));
    }
  };

  // Validates the project description for minimum length
  const validateProjectDescription = (description) => {
    if (description.length < 4) {
      setErrors(prev => ({ ...prev, projectDescription: 'Project description must be at least 4 characters long' }));
    } else {
      setErrors(prev => ({ ...prev, projectDescription: undefined }));
    }
  };

  // Validates the deadline to ensure it is at least 2 days ahead
  const validateDeadline = (date) => {
    const selectedDate = new Date(date);
    const currentDate = new Date();
    const minDeadline = new Date(currentDate.setDate(currentDate.getDate() + 2));
    if (!date || selectedDate < minDeadline) {
      setErrors(prev => ({ ...prev, deadline: 'Deadline must be at least 2 days ahead of today' }));
    } else {
      setErrors(prev => ({ ...prev, deadline: undefined }));
    }
  };

  // Validates the tags to ensure at least one tag is present
  const validateTags = (tags) => {
    if (tags.length === 0) {
      setErrors(prev => ({ ...prev, tags: 'At least one tag is required' }));
    } else {
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  // Validates the entire form and returns any errors found
  const validateForm = () => {
    const errors = {};
    if (projectName.length < 4) {
      errors.projectName = 'Project name must be at least 4 characters long';
    }
    if (projectDescription.length < 4) {
      errors.projectDescription = 'Project description must be at least 4 characters long';
    }
    const selectedDate = new Date(deadline);
    const currentDate = new Date();
    const minDeadline = new Date(currentDate.setDate(currentDate.getDate() + 2));
    if (!deadline || selectedDate < minDeadline) {
      errors.deadline = 'Deadline must be at least 2 days ahead of today';
    }
    if (tags.length === 0) {
      errors.tags = 'At least one tag is required';
    }
    return errors;
  };

  // Marks a field as touched for validation purposes
  const handleFocus = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Closes the modal when clicking outside of it
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  return (
    <>
      <ToastContainer />
      {isOpen && (
        <div className="modal-overlay z-50 fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center transition-opacity duration-300" onClick={handleOutsideClick}>
        <div className="bg-white p-5 rounded-lg shadow-lg max-w-md w-full relative">
          <h2 className="text-lg font-semibold mb-2">Add New Project</h2>

            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-700 shadow-2xl text-4xl"
            >
              &times;
            </button>

            <form onSubmit={handleSubmit}>
              {/* Project Name */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onFocus={() => handleFocus('projectName')}
                  className={`w-full p-2 border ${touched.projectName && errors.projectName ? 'border-red-500' : 'border-black'} rounded focus:outline-none focus:border-blue-500`}
                />
                {touched.projectName && errors.projectName && (
                  <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>
                )}
              </div>

              {/* Project Description */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Project Description
                </label>
                <textarea
                  placeholder="Enter project description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  onFocus={() => handleFocus('projectDescription')}
                  className={`w-full p-2 border ${touched.projectDescription && errors.projectDescription ? 'border-red-500' : 'border-black'} rounded focus:outline-none focus:border-blue-500`}
                />
                {touched.projectDescription && errors.projectDescription && (
                  <p className="text-red-500 text-sm mt-1">{errors.projectDescription}</p>
                )}
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 border border-black rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  onFocus={() => handleFocus('tags')}
                  className={`w-full p-2 border ${touched.tags && errors.tags ? 'border-red-500' : 'border-black'} rounded focus:outline-none focus:border-blue-500`}
                />
                {touched.tags && errors.tags && (
                  <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
                )}
              </div>

              {/* Deadline */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  onFocus={() => handleFocus('deadline')}
                  className={`w-full p-2 border ${touched.deadline && errors.deadline ? 'border-red-500' : 'border-black'} rounded focus:outline-none focus:border-blue-500`}
                />
                {touched.deadline && errors.deadline && (
                  <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
              >
                Add Project
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddProjectModal;