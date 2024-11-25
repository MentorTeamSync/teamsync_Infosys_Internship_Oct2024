import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { sidebarSelection } from '../../../../store/atoms/adminDashboardAtoms';
import AddTaskModal from '../task/AddTaskModal';
import TaskTable from '../table/TaskTable';
import CompletedTaskTable from '../table/CompletedTaskTable';
import UserTable from '../table/UserTable';
import FileTable from '../table/FileTable';

const Hero = ({ sidebarOpen, setSidebarOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedSidebar = useRecoilValue(sidebarSelection);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPriority, setProjectPriority] = useState('');
  const [projectTags, setProjectTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const projectId = localStorage.getItem('project_id');
      const token = localStorage.getItem('token');

      if (!projectId || !token) {
        console.error('Missing project ID or token');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/${projectId}`, {
          headers: {
            'authorization': token
          }
        });

        const project = response.data;

        // Update state
        setProjectName(project.name);
        setProjectDescription(project.description);
        setProjectPriority(project.priority);

        // Update localStorage
        localStorage.setItem('project_name', project.name);
        localStorage.setItem('project_description', project.description);
        localStorage.setItem('project_priority', project.priority);
        
        // Optional: store additional project details
        localStorage.setItem('project_status', project.status);
        localStorage.setItem('project_deadline', project.deadline);
        localStorage.setItem('project_users', project.noUsers);

        // Empty tags array for this example - modify as per your backend
        setProjectTags([]);

      } catch (error) {
        console.error('Error fetching project details:', error);
        if (error.response) {
          switch (error.response.status) {
            case 400:
              alert('Authentication error. Please log in again.');
              break;
            case 401:
              alert('Project not found.');
              break;
            case 500:
              alert('Internal server error. Please try again later.');
              break;
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const getPriorityColor = () => {
    switch (projectPriority.toLowerCase()) {
      case 'low':
        return 'bg-green-300 text-green-800';
      case 'medium':
        return 'bg-yellow-300 text-yellow-800';
      case 'high':
        return 'bg-red-300 text-red-800';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading project details...</div>;
  }

  return (
    <div className="p-4">
      <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 max-w-[800px]">
          {/* Sidebar toggle button for mobile */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="space-y-3 flex-1 min-w-0">
            {/* Project Name and Priority in one line */}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">{projectName}</h1>
              <span className={`px-3 py-1 ${getPriorityColor()} rounded-full text-sm font-medium whitespace-nowrap`}>
                {projectPriority}
              </span>
            </div>
            
            {/* Project Description with word wrapping */}
            {projectDescription && (
              <p className="text-gray-600 break-words whitespace-pre-wrap">
                {projectDescription}
              </p>
            )}
            
            {/* Display project tags if available */}
            {projectTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {projectTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-violet-100 text-violet-800 rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Task button aligned to top right */}
        <button
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap self-start mt-6 lg:static "
          onClick={openModal}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="inline-flex">Add Task</span>
        </button>
      </div>

      <TaskTable refreshTrigger={refreshTrigger} />
      <CompletedTaskTable />
      <UserTable />
      
      <div className="my-6" />
      
      <FileTable />

      <AddTaskModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Hero;