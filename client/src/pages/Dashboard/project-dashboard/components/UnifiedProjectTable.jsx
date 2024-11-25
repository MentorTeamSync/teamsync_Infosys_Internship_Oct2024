import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter } from 'lucide-react';
import { SearchBar } from './common/SearchBar';
import { TableHeader } from './table/TableHeader';
import { ProjectRow } from './table/ProjectRow';

const UnifiedProjectTable = ({ 
  endpoint, 
  title = "Table View",
  filterApproved = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCreatedProjectsView = endpoint === "my-created-projects";

  //fetch projects 
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://teamsync-infosys-internship-oct2024-9gij.vercel.app/project/${endpoint}`, {
          headers: {
            'authorization': token,
            'Content-Type': 'application/json'
          },
        });

        let projectData = response.data;
        
        // Filter approved projects if needed
        if (filterApproved) {
          projectData = projectData.filter(project => project.is_approved);
        }

        setProjects(projectData);
        setFilteredProjects(projectData);
      } catch (error) {
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [endpoint, filterApproved]);

  //search function
  const handleSearch = (e) => {
    e.preventDefault();
    const filtered = projects.filter((project) => {
      const { name, description } = project;
      const lowerCaseQuery = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(lowerCaseQuery) ||
        description.toLowerCase().includes(lowerCaseQuery) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
    });
    setFilteredProjects(filtered);
  };

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="py-6 max-w-[1200px] mx-auto">
      <form onSubmit={handleSearch} className="flex justify-between items-center mb-8">
        <div className="hidden lg:block font-medium text-lg">{title}</div>
        <div className="flex gap-4">
          <SearchBar 
            placeholder="Search for projects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-200 hover:shadow-lg transition duration-300">
            <Filter className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>
      </form>

      <div className="border border-gray-300 rounded-lg overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-gray-100 border-b border-gray-300">
            <TableHeader />
          </thead>
          <tbody>
            {filteredProjects.length > 0 ? (
              filteredProjects.map(project => (
                <ProjectRow 
                  key={project.id} 
                  project={project} 
                  isCreatedProject={isCreatedProjectsView}
                />
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnifiedProjectTable;