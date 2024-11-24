const { z } = require('zod');
const {User, Project, ProjectUser, Admin, ProjectStatistic} = require("../db/index"); 
const jwt = require("jsonwebtoken");
require("dotenv").config();

const projectCreateSchema = z.object({
    name: z.string().min(4, { message: "Name is required" }),   
    description: z.string().min(4, { message: "Description is required" }),
    tags: z.array(z.string().min(1, { message: "Tagname is required" })),
    deadline: z.optional(
        z.preprocess(
          (val) => {
            if (typeof val === "string") {
              const [day, month, year] = val.split("/").map(Number);
              const fullYear = year < 100 ? 2000 + year : year; // Handle two-digit year format
              const parsedDate = new Date(fullYear, month - 1, day); // Convert to JS Date (month is 0-based)
              return isNaN(parsedDate.getTime()) ? null : parsedDate;
            }
            return null;
          },
          z.date().refine((date) => !isNaN(date.getTime()), { message: "Invalid date format, expected dd/mm/yy" }),
        )
      ),
      priority: z.enum(['low', 'medium', 'high']).default('medium'), // Add priority field with enum
  });

  const projectUpdateSchema = z.object({
    project_id: z.string().uuid(),
    deadline: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
        .transform((dateStr) => {
            // Create date in UTC
            const date = new Date(dateStr + 'T23:59:59.999Z');
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            
            return date;
        })
        .optional(),
            status: z.enum(['active', 'reviewing', 'completed', 'archived']).optional(),
            description: z.string().optional(),
        }).refine(
            (data) => data.deadline || data.status || data.description,
            { message: "At least one of 'deadline', 'status', or 'description' must be provided." }
        );

    const addUsersSchema=z.object({
        project_id:z.string().length(36),
        user_ids:z.array(z.string().length(36))
    });

const UpdateDeadlineSchema=z.object({
    deadline: z.preprocess(
        (val) => {
          if (val === undefined || val === null || val === '') {
            return undefined; // Allow the field to be truly optional by returning undefined
          }
          if (typeof val === "string") {
            const [day, month, year] = val.split("/").map(Number);
            const fullYear = year < 100 ? 2000 + year : year; // Handle two-digit year format
            const parsedDate = new Date(fullYear, month - 1, day); // Convert to JS Date (month is 0-based)
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
          }
          return null;
        },
        z.date().optional().refine((date) => !isNaN(date.getTime()), { message: "Invalid date format, expected dd/mm/yy" })
      ).optional(), // Mark the deadline field as optional

})

async function validateCreateProject(req,res,next){
    //extract token from header
    const token=req.header("authorization");
    if(!token){
        return res.status(401).json({message:"Please enter a token"});
    }
    //verify token than extract email from token and verify if it exists in User
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findOne({email:decoded.email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        req.user_email=user.email;
        req.user_id=user.id;
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }

    //validate the input
    try {
        //safe parse
        const resp=projectCreateSchema.safeParse({
                name:req.body.name,
                description:req.body.description,
                deadline:req.body.deadline,
                tags:req.body.tags
            });
        if(!resp.success){
            return res.status(400).json({message:res.error.errors[0].message});
        }

        //check if a project with same name exists
        const project=await Project.findOne({name:req.body.name})
        if(project){
            return res.status(400).json({message:"Project with same name already exists",tag:1});
        }
        next();
    } catch (error) {
        return res.status(400).json({message:error});
    }
}

async function validateUpdateProject(req, res, next) {
    try {
        const validatedData = projectUpdateSchema.parse(req.body);
        // Add the validated data back to req.body
        req.body = validatedData;
        next();
    } catch (error) {
        return res.status(400).json({
            message: error.errors?.[0]?.message || "Validation error",
            errors: error.errors
        });
    }
}

async function validateAddUsers(req,res,next){
    //extract project_id and user_ids from req body and verify schema using zod 
    const resp=addUsersSchema.safeParse(req.body);
    if(!resp.success){
        return res.status(400).json({message:resp.error.errors[0].message});
    }
    next();
}

async function checkProjectExists(req,res,next){
    //extract project_id from req body and verify schema using zod 
    
    //if request is of type get then do this
    if(req.method=="GET"){
        const schema = z.string().length(36, { message: "project_id must be exactly 36 characters long" });
        const resp=schema.safeParse(req.params.project_id);
        if(!resp.success){
            return res.status(401).json({message:resp.error.errors[0].message});
        }
        //check if project exists
        const project=await Project.findOne({id:req.params.project_id});
        if(!project){
            return res.status(401).json({message:"Project not found"});
        }
        req.project=project;
        next();
    }else{
        const schema=z.object({
            project_id:z.string().length(36)
        });
        const resp=schema.safeParse(req.body);
        if(!resp.success){
            return res.status(400).json({message:resp.error.errors[0].message});
        }
        //check if project exists
        const project=await Project.findOne({id:req.body.project_id});
        if(!project){
            return res.status(400).json({message:"Project not found"});
        }
        next();
    }
    
}

async function checkUserExists(req,res,next){
    //extract user_id from req body and verify schema using zod 
    const schema=z.object({
        user_id:z.string().length(36)
    });
    const resp=schema.safeParse(req.body);
    if(!resp.success){
        return res.status(400).json({message:resp.error.errors[0].message});
    }
    //check if user exists
    const user=await User.findOne({id:req.body.user_id});
    if(!user){
        return res.status(400).json({message:"User not found"});
    }
    next();
}

async function checkIfCreator(req,res,next){
    //extract token from header
    const token=req.header("authorization");
    if(!token){
        return res.status(401).json({message:"Please enter a token"});
    }
    //verify token than extract email from token and verify if it exists in User
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findOne({email:decoded.email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        //verify req body to have project_id where project_id is uuid string 
        //using zod
        const schema=z.object({
            project_id:z.string().length(36)
        });
        const resp=schema.safeParse(req.body); 
        if(!resp.success){
            return res.status(400).json({message:resp.error.errors[0].message});
        }
        //check if project exists
        const projectGet=await Project.findOne({id:req.body.project_id});
        if(!projectGet){
            return res.status(400).json({message:"Project not found"});
        }
        //check if this user is the creator of the given project id that is sent in req body
        const project=await Project.findOne({id:req.body.project_id});
        if(project.creator_id!=decoded.email){
            return res.status(401).json({message:"You are not the owner of this project"});
        }
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
}

async function userAlreadyAdded(req,res,next){
    //extract project_id and user_id from req body and verify schema using zod 
    const schema=z.object({
        project_id:z.string().length(36),
        user_id:z.string().length(36)
    });
    const resp=schema.safeParse(req.body);
    if(!resp.success){
        return res.status(400).json({message:resp.error.errors[0].message});
    }
    //check if user is already added to the project
    const projectUser=await ProjectUser.findOne({project_id:req.body.project_id,user_id:req.body.user_id});
    if(projectUser){
        return res.status(400).json({message:"User already added to the project"});
    }
    next();
}

async function validateTokenProjectOwner(req,res,next){
    //extract token from header and check if he is the creator of the project_id he is trying to edit 
    try {
        const token=req.header("authorization");
        if(!token){
            return res.status(401).json({message:"Please enter a token"});
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const schema=z.object({
            project_id:z.string().length(36)
        });
        const resp=schema.safeParse(req.body); 
        if(!resp.success){
            return res.status(400).json({message:resp.error.errors[0].message});
        }
        //check if project exists
        const projectGet=await Project.findOne({id:req.body.project_id});
        if(!projectGet){
            return res.status(400).json({message:"Project not found"});
        }
        
        if(projectGet.creator_id!=decoded.email){
            return res.status(401).json({message:"You are not the owner of this project"});
        }
        req.project=projectGet;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});

    }
}

async function checkUserEmailExists(req,res,next){
    //extract email from jwt token
    const token=req.header("authorization");
    if(!token){
        return res.status(401).json({message:"Please enter a token"});
    }
    //verify token than extract email from token and verify if it exists in User
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findOne({email:decoded.email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        req.user=user;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
}

async function checkUserAdminExists(req,res,next){
    //extract email from jwt token
    const token=req.header("authorization");
    if(!token){
        return res.status(401).json({message:"Please enter a token"});
    }
    //verify token than extract email from token and verify if it exists in User
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findOne({email:decoded.email});
        const admin= await Admin.findOne({email:decoded.email});
        if(!admin && !user){
            return res.status(401).json({message:"Admin not found"});
        }
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
}

module.exports = {
    validateCreateProject,
    checkProjectExists,
    checkUserExists,
    checkIfCreator,
    userAlreadyAdded,
    validateTokenProjectOwner,
    checkUserEmailExists,
    validateUpdateProject,
    validateAddUsers,
    checkUserAdminExists
};
