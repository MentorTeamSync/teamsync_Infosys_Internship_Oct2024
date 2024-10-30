const { z } = require('zod');
const { Project, ProjectApproval, User, ProjectUser, Admin } = require('../db/index'); // Import necessary models
const jwt = require('jsonwebtoken');

// Define the Zod schema for admin sign-in
const AdminSignInSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
});

// Define the Zod schema for project approval
const ProjectApprovalSchema = z.object({
    project_id: z.string().min(1, { message: 'Project ID is required' }),
    status: z.enum(['approved', 'rejected'], { message: 'Status must be either "approved" or "rejected"' }),
});

//zod schema for change userstate from blocked to verified and opposite expect user to send user_id in request body
const UserStateSchema = z.object({
    user_id: z.string().min(1, { message: 'User ID is required' }),
});

// Middleware function for validating admin sign-in inputs
const validateAdminSignIn = (req, res, next) => {
    try {
        // Validate the request body against the schema
        AdminSignInSchema.parse(req.body);
        next(); // Proceed to the next middleware/route handler if valid
    } catch (error) {
        // If validation fails, return an error response
        return res.status(400).json({ message: error.errors });
    }
};

// Middleware function for validating project approval inputs
const validateProjectApproval = (req, res, next) => {
    try {
        // Validate the request body against the schema
        ProjectApprovalSchema.parse(req.body);
        next(); // Proceed to the next middleware/route handler if valid
    } catch (error) {
        // If validation fails, return an error response
        return res.status(400).json({ message: error.errors });
    }
};


//Middleware function to handle block project logic 

const blockProject=async(req,res)=>{
    try{

        const { project_id} = req.body;
        
        // Extract admin ID from the authenticated user

        const project = await Project.findOne({ id: project_id });
           
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const name=project.name;

        //check if project is already blocked
        if(project.is_blocked){
            return res.status(400).json({message:"Project is already blocked",name:name});
        }
        await Project.findOneAndUpdate({ id: project_id }, { $set: { is_blocked: true } }, { new: true });
        
        return res.status(200).json({
            message: `Project ${project.name} has been blocked successfully.`,
            name:name
        });
    } catch (error) {
        console.error('Error during blocking project:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }


    }




// Middleware function to handle the project approval logic
const approveProject = async (req, res) => {
    try {
        const { project_id, status } = req.body;
        const { adminId } = req.user; // Extract admin ID from the authenticated user

        const project = await Project.findOne({id:project_id});
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        //check if project is already approved
        if(project.is_approved){
            return res.status(400).json({message:"Project is already approved"});
        }

        // Create a new project approval record
        const newApproval = new ProjectApproval({
            project_id,
            admin_id: adminId,
            status,
        });
        await newApproval.save();

        // Update the project's approval status based on the admin's decision
        project.is_approved = status === 'approved';
        await project.save();

        return res.status(200).json({
            message: `Project has been ${status} successfully.`,
            approval: newApproval,
        });
    } catch (error) {
        console.error('Error during project approval:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const tokenValidationAdmin=async(req,res, next)=>{
    try {
        const token = req.header('authorization');
        if (!token) {
            return res.status(401).json({ message: 'Token not found' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ email: decoded.email });
        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' });
        }
        req.user = { adminId: admin.id }; // Set the authenticated user in the request object
        next();
    } catch (error) {
        console.error('Error validating token:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

const tokenValidationUser=async(req,res,next)=>{
    try {
        const token = req.header('authorization');
        if (!token) {
            return res.status(401).json({ message: 'Token not found' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = { userId: user.id }; // Set the authenticated user in the request object
        next();
    } catch (error) {
        console.error('Error validating token:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}

const getAllUsers = async (req, res) => {
    try {
        
        const users = await User.find(
            { state: { $ne: 'pending' } },
            '-password_hash -registration_otp -reset_otp'
          ).lean();
          
        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

// Middleware function to get all projects with their details
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.aggregate([
            {
                $lookup: {
                    from: 'projecttags', // Name of the tags collection
                    localField: 'id', // Project ID
                    foreignField: 'project_id', // Matching project_id in tags
                    as: 'tags' // The name of the field where the tags will be stored
                }
            },
            {
                $project: {
                    id: 1,
                    name: 1,
                    description: 1,
                    created_at: 1,
                    updated_at: 1,
                    deadline: 1,
                    creator_id: 1,
                    is_approved: 1,
                    is_blocked:1,
                    status: 1,
                    noUsers: 1,
                    tags: '$tags.tag_name' // Only return the tag names
                }
            }
        ]);

        return res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching all projects:', error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

async function validateUserStateChange(req,res,next){
    try {
        //safe parse use
        UserStateSchema.parse(req.body)
        //find if user exists
        const user = await User.findOne({ id: req.body.user_id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        req.user=user;
        next();
    } catch (error) {
        return res.status(400).json({ message: error.errors });
    }
}

module.exports = {
    validateAdminSignIn,
    validateProjectApproval,
    approveProject,
    getAllUsers,
    getAllProjects,
    tokenValidationAdmin,
    tokenValidationUser,
    validateUserStateChange,
    blockProject
};
