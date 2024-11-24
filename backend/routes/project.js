const express = require("express");
const { Project, ProjectTag, ProjectUser, User, Task, ProjectStatistic } = require("../db");
const { validateCreateProject ,checkUserEmailExists, validateTokenProjectOwner, validateUpdateProject, validateAddUsers, checkProjectExists, checkUserAdminExists} = require("../middlewares/ProjectMiddlewares");
const {tokenValidation}=require("../middlewares/UserMiddlewares");
const router = express.Router();
const jwt=require("jsonwebtoken");
//require dotenv
require("dotenv").config();

//create a project route
// create a project route
router.post("/create", validateCreateProject, async (req, res) => {
    const user_id = req.user_id; // Assuming req.user_id contains the ID of the logged-in user
    const email = req.user_email;

    // Get req body and extract name, description, tags, and deadline
    const { name, description, tags, deadline, priority } = req.body;
    
    // Convert deadline from "dd/mm/yyyy" to Date object
    const [day, month, year] = deadline.split("/").map(Number);
    const fullYear = year < 100 ? 2000 + year : year; // Handle two-digit year format
    const parsedDate = new Date(fullYear, month - 1, day); // Convert to JS Date (month is 0-based)

    // Create a new project object
    const project = new Project({
        name: name,
        description: description,
        deadline: parsedDate,
        creator_id: email, // Save the email of the creator as creator_id
        priority: priority
    });

    try {
        // Save the project in the database
        await project.save();
        const pid = project.id; // Get the project ID after saving

        // Add the project creator (user) to the ProjectUser table
        await ProjectUser.create({
            user_id: user_id, // Assign the user to the project
            project_id: pid   // The project they just created
        });

        // If tags are present, add them to the ProjectTag
        if (tags.length > 0) {
            tags.forEach(async (tag) => {
                await ProjectTag.create({ project_id: pid, tag_name: tag });
            });
        }

        return res.status(200).json({ message: "Project created and user assigned successfully" });
    } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


//get my created projects
router.get("/my-created-projects",checkUserEmailExists,async (req,res)=>{
    //get the token from headers and decode it to get the email id
    const token=req.header("authorization");
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const email=decoded.email;
    //get all the projects created by the user and also get tags of them
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
            $match: {
                creator_id: email, // Filter projects by creator_id matching the email variable
                status: { $ne: 'archived' } // Exclude projects with status 'archived'
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
                status: 1,
                priority: 1,
                noUsers:1,
                tags: '$tags.tag_name' // Only return the tag names
            }
        }
    ]);
    return res.status(200).json(projects);
})

//update a project 
router.put("/update", validateTokenProjectOwner, validateUpdateProject, async (req, res) => {
    const { project_id, description, deadline, status } = req.body;

    // Attempt to retrieve the project by ID
    let project;
    try {
        project = await Project.findOne({ id: project_id });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving project", error: error.message });
    }

    // Update project details if provided
    try {
        if (description) project.description = description;
        if (status) project.status = status;
        if (deadline) {
            project.deadline = deadline;
        }

        // Update the updated_at field to the current date
        project.updated_at = Date.now();

        // Save the updated project
        await project.save();
        return res.status(200).json({ message: "Project updated successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Error updating project details", error: error.message });
    }
});

//router to add users to a project
router.post("/addusers", validateTokenProjectOwner, validateAddUsers, async (req, res) => {
    const project_id = req.body.project_id;
    const user_ids = req.body.user_ids;
    
    const errors = []; // Array to collect errors
  
    try {
      for (const user_id of user_ids) {
        // Check if the user exists
        const userExists = await User.findOne({ id: user_id });
        if (!userExists) {
          errors.push(`User with id ${user_id} does not exist`);
          continue; // Skip to the next iteration
        }
  
        // Check if the user is already added to the project
        const userAlreadyAdded = await ProjectUser.findOne({
          user_id: user_id,
          project_id: project_id
        });
        if (userAlreadyAdded) {
          errors.push(`User with id ${user_id} is already added to the project`);
          continue; // Skip to the next iteration
        }
  
        // Add the user to the project
        await ProjectUser.create({
          user_id: user_id,
          project_id: project_id
        });
      }
  
      // If there are any errors, return them as a response
      if (errors.length > 0) {
        return res.status(400).json({ message: "Some users could not be added", errors });
      }

      const tempProject=req.project;
      //increment noUsers field by 1 and save
        tempProject.noUsers+=user_ids.length;
        await tempProject.save();
  
      // If no errors, send success message
      return res.status(200).json({ message: "Users added successfully" });
  
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
//get all users assigned to a project
router.get("/get-all-users/:project_id", checkProjectExists, checkUserAdminExists, async (req, res) => {
    try {
        // Get project id from the URL params
        const project_id = req.params.project_id;
        // console.log("hii")

        // Get all users assigned to the project
        const users = await ProjectUser.aggregate([
            {
                $match: {
                    project_id: project_id, // Filter users by project_id
                }
            },
            {
                $lookup: {
                    from: 'users', // Name of the users collection
                    localField: 'user_id', // User ID in ProjectUser collection
                    foreignField: 'id', // Matching field in Users collection
                    as: 'user' // The field where the user details will be stored
                }
            },
            {
                $unwind: '$user' // Flatten the array of user details
            },
            {
                $project: {
                    _id: 0, // Exclude _id from the result
                    id: '$user.id', // Get user id
                    name: '$user.name', // Get user name
                    email: '$user.email', // Get user email
                    created_at: '$user.created_at', // Get user created_at field
                    joined_at: '$joined_at' // Get joined_at from ProjectUser
                }
            }
        ]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found for this project' });
        }

        // Send the retrieved users as a response
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


//get projects i am assigned to 
router.get("/get-my-assigned-projects", checkUserEmailExists, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Please enter a valid token" });
        }
        const user_id = user.id;

        // Aggregate to find projects assigned to the user and include tags
        const projects = await Project.aggregate([
            {
                $lookup: {
                    from: 'projecttags', // Name of the tags collection
                    localField: 'id', // Project ID in projects collection
                    foreignField: 'project_id', // Matching project_id in tags collection
                    as: 'tags' // Field to store tags in the result
                }
            },
            {
                $match: {
                    id: { $in: (await ProjectUser.find({ user_id })).map(proj => proj.project_id) },
                    status: { $ne: 'archived' } // Exclude projects with status 'archived'
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
                    status: 1,
                    priority: 1,
                    noUsers: 1,
                    tags: '$tags.tag_name' // Return only tag names
                }
            }
        ]);

        if (projects.length === 0) {
            return res.status(404).json({ message: "No projects found for this user" });
        }

        return res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching assigned projects:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});


//get project report
router.get('/report/:project_id', tokenValidation, checkProjectExists,  async (req, res) => {
    try {
        const project_id = req.params.project_id;

        // Fetch all tasks for the given project ID
        const tasks = await Task.find({ project_id });

        const totalTasks = tasks.length;

        // Number of completed tasks (status = '2')
        const completedTasks = tasks.filter(task => task.status === '2').length;

        // Past due tasks (deadline < current date and not completed)
        const now = new Date();
        const pastDueTasks = tasks.filter(task => new Date(task.deadline) < now && task.status !== '2').length;

        // Pending tasks (not completed and deadline not passed)
        const pendingTasks = tasks.filter(task => new Date(task.deadline) >= now && task.status !== '2').length;

        // Response
        res.status(200).json({
            totalTasks,
            completedTasks,
            pastDueTasks,
            pendingTasks,
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/:project_id",tokenValidation,checkProjectExists, (req,res)=>{
    try {
        const project=req.project;
        res.status(200).json(project);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
})

// Route to fetch the completion percentage of a project
router.get('/completion-percentage/:project_id', async (req, res) => {
    const project_id = req.params.project_id;
  
    try {
      // Fetch the project statistics
      const projectStats = await ProjectStatistic.findOne({ project_id: project_id });
  
      if (!projectStats) {
        return res.status(404).json({ message: 'Project statistics not found.' });
      }
  
      // Return the stored completion percentage
      return res.status(200).json({
        project_id: project_id,
        completion_percentage: projectStats.completion_percentage
      });
    } catch (error) {
      console.error('Error fetching project completion percentage:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
  );

module.exports = router;
