import React, { useState } from "react";
import axios from "axios"; // Import Axios
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

const EditProfileModal = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(""); // New state for role
  const [loading, setLoading] = useState(false); // For loading state
  const [error, setError] = useState(null); // For input validation

  const validateUsername = (name) => {
    if (name.length < 4) {
      setError("Username must be at least 4 characters long");
      return false;
    } else {
      setError(null);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      return;
    }

    const token = localStorage.getItem("token"); // Get token from local storage

    if (!token) {
      toast.error("Authorization token missing. Please log in again.");
      return;
    }

    setLoading(true); // Start loading

    try {
      const response = await axios.put(
        "http://localhost:3001/user/edit-profile",
        { name: username, role }, // Send the username and role in the body
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        onClose(); // Close modal after success
        window.location.reload();
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          toast.error("Invalid request. Please try again.");
        } else if (error.response.status === 500) {
          toast.error("Server error. Please try again later.");
        }
      } else {
        toast.error("An unexpected error occurred!");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleInputChange = (e) => {
    setUsername(e.target.value);
    validateUsername(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  return (
    <>
      <ToastContainer /> {/* Include ToastContainer for displaying toasts */}
      {isOpen && (
        <div className="z-50 fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center transition-opacity duration-300">
          <div className="bg-white py-8 px-8 rounded-lg shadow-lg max-w-lg w-full relative">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-700 shadow-2xl text-3xl"
            >
              &times;
            </button>

            <form onSubmit={handleSubmit}>
              {/* Username Input */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter new username"
                  value={username}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    error ? "border-red-500" : "border-black"
                  } rounded focus:outline-none focus:border-blue-500`}
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              {/* Role Input */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  placeholder="Enter your role"
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full p-2 border border-black rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-2 px-4 text-white rounded-lg transition-colors ${
                  loading ? "bg-gray-500" : "bg-blue-950 hover:bg-blue-900"
                }`}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfileModal;
