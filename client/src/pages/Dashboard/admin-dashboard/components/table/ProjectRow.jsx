import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ProjectRow = ({ project }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleApproveClick = () => {
    setShowModal(true);
    setDropdownOpen(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleBlockClick=async ()=>{
    const toastId = toast.loading('wait blocking  project...');
    try{
      const token = localStorage.getItem('token'); // Get JWT token from localStorage
      
      const response = await axios.post(
        'http://localhost:3001/admin/block-project',
        {
          project_id: project.id,
          
        },
        {
          headers: {
            authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      const projectname=response.data.name;
      
      
        
      if (response.status === 200) {
        toast.success(  `${projectname} has been blocked `, { id: toastId });
        
        window.location.reload(); // Hard reload the page
      }
      if(response.status===400){
        toast.success(  `${projectname} has already been blocked been blocked `, { id: toastId });
        window.location.reload();
      }

      console.log(response);


    }catch (error) {
      let errorMessage = "An unexpected error occurred";
      toast.error(errorMessage, { id: toastId });
  }
}

  const handleConfirmApprove = async () => {
    const toastId = toast.loading('Approving project...');
    
    try {
      const token = localStorage.getItem('token'); // Get JWT token from localStorage
      
      const response = await axios.post(
        'http://localhost:3001/admin/approve-project',
        {
          project_id: project.id,
          status: 'approved'
        },
        {
          headers: {
            authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(response.status);

      if (response.status === 200) {
        toast.success('Project has been approved successfully.', { id: toastId });
        setShowModal(false);
        window.location.reload(); // Hard reload the page
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = "Invalid request. Please check your data.";
            break;
          case 404:
            errorMessage = "Project not found.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
        }
      }
      
      toast.error(errorMessage, { id: toastId });
    }
  };

  const formattedDeadline = new Date(project.deadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  return (
    <>
      <tr className="border-b last:border-b-0 hover:bg-gray-50">
        <td className="py-4 px-4">
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
          <span className={`inline-flex justify-center items-center px-2 py-1 rounded-full text-xs ${project.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {project.is_approved ? project.status : "Need Approval"}
          </span>
        </td>
        <td className="hidden sm:table-cell py-4 px-4 text-black text-xs">
          <div className="max-w-[200px] truncate" title={project.description}>
            {project.description}
          </div>
        </td>
        <td className="py-4 px-4">
          <div className="flex -space-x-2">
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
        <td className="py-4 px-4">
          <ProgressBar progress={project.progress || 0} />
        </td>
        <td className="py-4 ps-7 px-4">
          <div className="text-xs text-gray-500">{formattedDeadline}</div>
        </td>
        <td className="py-4 px-2 relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-5 w-5 text-gray-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-10">
              {project.is_approved === false && (
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  onClick={handleApproveClick}
                >
                  Approve Project
                </button>
              )}
               {!project.is_blocked&&(<button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  onClick={handleBlockClick}
                >
                  Block
                </button>
                 )}

            </div>
          )}
        </td>
      </tr>

      {showModal && (
        <ConfirmationModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmApprove}
        />
      )}
    </>
  );
};

const ConfirmationModal = ({ onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Approve Project</h2>
        <p className="text-gray-700 mb-4">Are you sure you want to approve this project?</p>
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
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md flex items-center justify-center min-w-[100px]"
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