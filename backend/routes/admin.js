// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { Admin } = require("../db/index"); // Import the Admin model
const { validateAdminSignIn, tokenValidationAdmin, tokenValidationUser, validateUserStateChange ,blockProject} = require("../middlewares/AdminMiddlewares"); // Import the validation middleware
const { validateProjectApproval, approveProject, getAllProjects, getAllUsers } = require("../middlewares/AdminMiddlewares");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Define admin sign-in route
router.post("/signin", validateAdminSignIn, async (req, res) => {
    try {
        // Destructure the validated data from the request body
        const { email, password } = req.body;

        // Find the admin by email
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ errors: ["Admin not found."] });
        }

        // Compare the hashed password with the provided password
        const isMatch = await bcrypt.compare(password, admin.password_hash);

        if (!isMatch) {
            return res.status(401).json({ errors: ["Invalid password."] });
        }

        // Create a JWT token using the admin's email
        const token = jwt.sign({ email, admin_id:admin.id }, process.env.JWT_SECRET, {
            expiresIn: "12h",
        });

        return res.json({
            message: "Admin signed in successfully.",
            token,
            name:admin.name
        });
    } catch (error) {
        console.error("Error during admin sign-in:", error);
        return res.status(500).json({
            errors: ["Internal server error 1."],
        });
    }
});

// Additional routes can be defined here
router.post("/approve-project",tokenValidationAdmin, validateProjectApproval, approveProject);

// route for blocking project feature
router.post("/block-project",blockProject);

// Route to get all users (excluding passwords) and their projects
router.get("/all-users",tokenValidationAdmin, getAllUsers);

// Route to get all projects and their details
router.get("/all-projects",tokenValidationAdmin, getAllProjects);

router.get("/all-users-Users", tokenValidationUser, getAllUsers);


router.put("/user-state",tokenValidationAdmin,validateUserStateChange, async (req,res)=>{
    //request body
    const user=req.user;
    if (user.state==="verified"){
        user.state="blocked";
    }else if(user.state==="blocked"){
        user.state="verified";
    }else{
        return res.status(400).json({message:"User not verified yet"});
    }

    try {
        await user.save();
        return res.status(200).json({message:"User state updated successfully"});
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
})

module.exports = router;

