import { useState, useEffect, useRef } from 'react';
import { Check, MoreVertical, } from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ProjectRow = ({ project, onArchive }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // "approve" or "archive"
  const dropdownRef = useRef(null);
  const [progress, setProgress]=useState(0);

  // Opens the modal and sets the action type (approve/archive)
  const openModal = (action) => {
    setModalAction(action);
    setShowModal(true);
    setDropdownOpen(false);
  };

  // Closes the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalAction(null);
  };

  // Handles project approval
  const handleApprove = async () => {
    const toastId = toast.loading('Approving project...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/approve-project',
        {
          project_id: project.id,
          status: 'approved',
        },
        {
          headers: {
            authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        toast.success('Project has been approved successfully.', { id: toastId });
        setShowModal(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to approve the project.', { id: toastId });
    }
  };

  // Handles project archiving
  const handleArchive = async () => {
    const toastId = toast.loading('Archiving project...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/archive-project',
        {
          project_id: project.id,
        },
        {
          headers: {
            authorization: token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        toast.success('Project has been archived successfully.', { id: toastId });
        setShowModal(false);
        onArchive(project.id); // Notify the parent to archive the project
      }
    } catch (error) {
      toast.error('Failed to archive the project.', { id: toastId });
    }
  };

  const formattedDeadline = new Date(project.deadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  useEffect(() => {
    const handleClickOutsideDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideDropdown);
    } else {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const fetchCompletionPercentage = async () => {
      const projectid=project.id;
      try {
        const token=localStorage.getItem("token");
        const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/report/${projectid}`, {
          headers: {
            authorization: token,
          },
        });
        const value=(response.data.completedTasks/response.data.totalTasks)*100;
        const completionPercentage = parseFloat(value || 0).toFixed(2);
        setProgress(completionPercentage);
      } catch (error) {
        console.error('Error fetching completion percentage:', error);
      }
    };

    fetchCompletionPercentage();
  }, []);

  return (
    <>
    <tr className="border-b last:border-b-0 hover:bg-gray-50">
      <td className="py-4 px-4 md:px-4 max-w-[150px] truncate">
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium text-sm md:text-md line-clamp-1">{project.name}</div>
            <div className="text-xs text-gray-500" title={project.creator_id}>
              {project.creator_id.length > 16 ? project.creator_id.slice(0, 16) + '...' : project.creator_id}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-2">
        <span
          className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${
            project.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {project.is_approved ? project.status : 'Need Approval'}
        </span>
      </td>
      <td className="py-3 px-2 md:px-4 text-xs md:table-cell">
        <div className="break-words max-w-[200px]" title={project.description}>
          {project.description}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex -space-x-2 relative">
          {[...Array(Math.min(3, project.noUsers))].map((_, i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/32?img=${i + 1}`}
              alt={`Member ${i + 1}`}
              className="w-7 h-7 rounded-full border-2 border-white"
            />
          ))}
          {project.noUsers > 3 && (
            <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
              +{project.noUsers - 3}
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-4 md:px-4">
        <ProgressBar progress={progress || 0} />
      </td>
      <td className="py-4 ps-7 px-4">
        <div className="text-xs text-gray-500">{formattedDeadline}</div>
      </td>
      <td className="py-4 px-2 relative">
        <div className="flex items-center gap-2">
          {/* Approve Project Icon - Only show if not approved */}
          {!project.is_approved && (
            <button
              onClick={() => openModal('approve')}
              className="p-1.5 hover:bg-green-100 rounded-full transition-colors duration-200 group relative"
              title="Approve Project"
            >
              <Check className="h-5 w-5 text-green-600 cursor-pointer" />
              <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 right-0 top-full mt-1 whitespace-nowrap">
                Approve Project
              </span>
            </button>
          )}
          
          {/* Three Dots Menu */}
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
          {dropdownOpen && (
            <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-10">
              {project.is_approved && (
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100"
                  onClick={() => openModal('archive')}
                >
                  Archive Project
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>

    {showModal && (
      <ConfirmationModal
        action={modalAction}
        onClose={handleCloseModal}
        onConfirm={modalAction === 'approve' ? handleApprove : handleArchive}
      />
    )}
  </>
  );
};

const ConfirmationModal = ({ action, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  const modalTitle = action === 'approve' ? 'Approve Project' : 'Archive Project';
  const modalMessage =
    action === 'approve'
      ? 'Are you sure you want to approve this project?'
      : 'Are you sure you want to archive this project?';

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutsideModal = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutsideModal);
    return () => document.removeEventListener('mousedown', handleClickOutsideModal);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">{modalTitle}</h2>
        <p className="text-gray-700 mb-4">{modalMessage}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md flex items-center justify-center min-w-[100px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectRow;
