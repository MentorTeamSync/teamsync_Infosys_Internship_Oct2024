const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import uuid
require('dotenv').config();

// Create a function to connect to MongoDB
const connectDB = async () => {
    if (!process.env.DB_CONNECTION_STRING) {
        console.error("DB_CONNECTION_STRING is not defined in .env file");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        console.log("Successfully connected to the database.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error; // Propagate the error
    }
};


const generateRandomOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit random number
};

// User Schema
const UserSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    registration_otp: {
        type: String,
        default: generateRandomOTP
    },
    reset_otp: {
        type: String,
        default: generateRandomOTP
    },
    state: {
        type: String,
        enum: ['pending', 'verified', 'blocked'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: Date
}); // Disables MongoDB's default _id field

// Cascade delete related entries in ProjectUser when a User is deleted
UserSchema.pre('remove', async function (next) {
    try {
        await ProjectUser.deleteMany({ user_id: this.id }); // Remove associated projects in ProjectUser
        next();
    } catch (error) {
        next(error);
    }
});

// Admin Schema
const AdminSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: Date
});

// Project Schema
const ProjectSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    deadline: Date,
    creator_id: {
        type: String,
        ref: 'User',
        required: true
    },
    is_approved: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'reviewing', 'completed', 'archived'],
        default: 'active'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },//a number of users field that is 1 at project creation
    noUsers: {
        type: Number,
        default: 1
    }
});

// Cascade delete related entries in ProjectUser when a Project is deleted
ProjectSchema.pre('remove', async function (next) {
    try {
        await ProjectUser.deleteMany({ project_id: this.id }); // Remove associated users in ProjectUser
        next();
    } catch (error) {
        next(error);
    }
});

// Project Approval Schema
const ProjectApprovalSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    admin_id: { // Fixed duplicate `id` field
        type: String,
        ref: 'Admin',
        required: true
    },
    approval_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['approved', 'rejected'],
        required: true,
    }
});

// Project User Schema
const ProjectUserSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    joined_at: {
        type: Date,
        default: Date.now
    }
});

// Task Schema
const TaskSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    deadline: Date,
    status: {
        type: String,
        enum: ['0', '1', '2'],
        required: true
    },
    priority: {
        type: String,
        enum: ['0', '1', '2'],
        required: true
    },
    creator_id: {
        type: String,
        ref: 'User',
        required: true
    },
    assignees: [{
        type: String,
        ref: 'User',
        default: []
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    project_name: {
        type: String,
        required: true
    }
});
// Pre-save middleware to detect changes to 'status' field
TaskSchema.pre('save', async function (next) {
    if (this.isModified('status') && this.status === '2') {
        console.log(`Status changed to "complete" for Task ID: ${this._id}`);
        await updateProjectStatistics(this.project_id);  // Update project statistics on status change
    }
    next();
});
// Middleware for handling the deletion trigger
TaskSchema.pre('deleteOne', async function (next) {
    try {
        const query = this.getFilter();
        const task = await this.model.findOne(query);
        if (task) {
            // Update project statistics based on task deletion
            await updateProjectStatisticsOnTaskDeletion(task);
        }
        next();
    } catch (error) {
        console.error('Error in pre-delete middleware:', error);
        next(error);
    }
});

// Task History Schema
const TaskHistorySchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    task_id: {
        type: String,
        ref: 'Task',
        required: true
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    old_value: String,
    new_value: String,
    action_time: {
        type: Date,
        default: Date.now
    }
});

// Comment Schema
const CommentSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    task_id: {
        type: String,
        ref: 'Task',
    },
    creator_id: {
        type: String,
        ref: 'User',
        required: true
    },
    content: {
        type: String
    },
    file_content: {
        type: String
    },
    file_name: String,
    file_size: Number,
    file_type: String,
    file_data: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    likes: [{
        type: String,
        ref: 'User',
        default: []
    }],
    dislike: [{
        type: String,
        ref: 'User',
        default: []
    }]
});
CommentSchema.post('save', async function (doc, next) {
    try {
        // Fetch all users associated with the project except the commenter
        const projectUsers = await ProjectUser.find({ project_id: doc.project_id })
            .select('user_id')
            .lean();

        if (!projectUsers || projectUsers.length === 0) {
            console.error('No users found for the project.');
            return next();
        }

        // Filter out the commenter
        const usersToUpdate = projectUsers
            .map(user => user.user_id)
            .filter(userId => userId.toString() !== doc.creator_id.toString());


        // Increment the unread count for each user (excluding commenter)
        for (const userId of usersToUpdate) {
            const notification = await Notification.findOneAndUpdate(
                {
                    user_id: userId,        // Match the user ID
                    project_id: doc.project_id // Match the project ID
                },
                { $inc: { unread_messages: 1 } }, // Increment the unread count
                { upsert: false, new: true } // Create if it doesn't exist
            );

            if (!notification) {
                // If no notification exists, create a new one
                for (const userId of usersToUpdate){
                    await Notification.create({
                        user_id: userId, // Add the correct user_id
                        project_id: doc.project_id,
                        // email: doc.email,
                        unread_messages: 1, // Initialize unread count to 1
                    });
                }
            }
        }

        next();
    } catch (error) {
        console.error('Error updating unread count for multiple users:', error);
        next(error);
    }
});


//Notification schema
const NotificationSchema= new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    user_id: {
  
      type: String,
        ref: 'User',
        required: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    unread_messages: {
        type: Number,
        default: 0,
        min: 0, // Ensures the count is never negative
      },
})
// Project Statistic Schema
const ProjectStatisticSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    total_tasks: {
        type: Number,
        default: 0
    },
    completed_tasks: {
        type: Number,
        default: 0
    },
    overdue_tasks: {
        type: Number,
        default: 0
    },
    completion_percentage: {
        type: Number,
        default: 0
    },
    last_updated: {
        type: Date,
        default: Date.now
    }
});
// Project Tag Schema
const ProjectTagSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    tag_name: String,
    tagged_at: {
        type: Date,
        default: Date.now
    }
});

// Models
const User = mongoose.model('User', UserSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const Project = mongoose.model('Project', ProjectSchema);
const ProjectApproval = mongoose.model('ProjectApproval', ProjectApprovalSchema);
const ProjectUser = mongoose.model('ProjectUser', ProjectUserSchema);
const Task = mongoose.model('Task', TaskSchema);
const TaskHistory = mongoose.model('TaskHistory', TaskHistorySchema);
const Comment = mongoose.model('Comment', CommentSchema);
const ProjectStatistic = mongoose.model('ProjectStatistic', ProjectStatisticSchema);
const ProjectTag = mongoose.model('ProjectTag', ProjectTagSchema);
const Notification = mongoose.model('Notification', NotificationSchema);


// Function to update ProjectStatistics
async function updateProjectStatistics(projectId) {
    try {
        const projectStat = await ProjectStatistic.findOne({ project_id: projectId });

        if (projectStat) {
            // Increment completed tasks
            projectStat.completed_tasks += 1;

            // Update completion percentage
            projectStat.completion_percentage =
                (projectStat.completed_tasks / projectStat.total_tasks) * 100;

            projectStat.last_updated = Date.now();

            // Save updated statistics
            await projectStat.save();
            console.log('Project statistics updated:', projectStat);

        } else {
            console.log('No project statistics found for this task.');
        }
    } catch (error) {
        console.error('Error updating project statistics:', error);
    }
}
// Function to update ProjectStatistics on task deletion
async function updateProjectStatisticsOnTaskDeletion(task) {
    try {
        const projectStat = await ProjectStatistic.findOne({ project_id: task.project_id });
        if (projectStat) {
            console.log(task);
            console.log(task.status);
            // Decrement total tasks and, if the task was completed, decrement completed tasks
            projectStat.total_tasks -= 1;
            if (task.status == '2') {
                projectStat.completed_tasks -= 1;
            }
            // Update completion percentage
            projectStat.completion_percentage = 
                projectStat.total_tasks > 0
                    ? (projectStat.completed_tasks / projectStat.total_tasks) * 100
                    : 0;
            projectStat.last_updated = Date.now();
            // Save updated statistics
            await projectStat.save();
            console.log('Project statistics updated on task deletion:', projectStat);

        } else {
            console.log('No project statistics found for this task.');
        }
    } catch (error) {
        console.error('Error updating project statistics on task deletion:', error);
    }
}


// const bcrypt = require("bcrypt");
// async function test(){
//     //generate a new admin
//     const password_hash = await bcrypt.hash("admin3@1234", 10);
//     const admin=new Admin({
//         name:"admin3",
//         email:"admin3@mail.com",
//         password_hash
//     });
//     await admin.save();
// }

// test();


// Export models
module.exports = {
    User,
    Admin,
    Project,
    ProjectApproval,
    ProjectUser,
    Task,
    TaskHistory,
    Comment,
    ProjectStatistic,
    ProjectTag,
    Notification,
    connectDB
};
