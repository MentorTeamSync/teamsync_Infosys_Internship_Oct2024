// Hero.js
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import ProjectTable from './ProjectTable';
import AddProjectModal from './project/AddProjectModal';
import { sidebarSelection } from '../../../../store/atoms/adminDashboardAtoms';
import { useRecoilValue } from 'recoil';
import PendingProject from './PenginProject';
import Users from './Users';
import ArchivedProjectsTable from './table/ArchivedProjectsTable'; // Import ArchivedProjectsTable

// Hero component to manage the main content area
const Hero = ({ sidebarOpen, setSidebarOpen }) => {
  const selectedSidebar = useRecoilValue(sidebarSelection);
  const [isModalOpen, setIsModalOpen] = useState(false);

   // Function to open the modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">
              {selectedSidebar === 'approved' ? 'Approved Projects' : selectedSidebar === 'users' ? 'All Users' : selectedSidebar === "need-approval" ? 'Projects Waiting for Approval' : ''}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {selectedSidebar === 'approved' ? 'Approved projects by the admin' : selectedSidebar === 'users' ? 'All users of the application' : selectedSidebar === "need-approval" ? 'Projects waiting for approval by the admin' : ''}
            </p>
          </div>
        </div>
        {/* <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-950 text-white rounded-lg hover:bg-blue-900 transition-colors"
          onClick={openModal} // Open modal on click
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="hidden sm:inline">Add Project</span>
        </button> */}
      </div>

      {/* Conditional rendering for main content based on sidebar selection */}
      {selectedSidebar === 'approved' && (
        <>
          <ProjectTable />
          {/* Archived Projects Dropdown */}
          <ArchivedProjectsTable /> 
        </>
      )}
      {selectedSidebar === 'need-approval' && <PendingProject />}
      {selectedSidebar === 'users' && <Users />}

      {/* Add Project Modal */}
      <AddProjectModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Hero; // Export the Hero component