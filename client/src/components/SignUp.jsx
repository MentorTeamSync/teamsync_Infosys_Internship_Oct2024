//required imports
import {
  CloseRounded,
  EmailRounded,
  PasswordRounded,
  Person,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { useTheme } from "styled-components";
import { IconButton, Modal } from "@mui/material";
import { loginFailure, loginStart, loginSuccess } from "../redux/userSlice";
import { openSnackbar } from "../redux/snackbarSlice";
import { useDispatch } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import validator from "validator"; //validates the inputs
import axios from "axios"; //helps to communicate with backends
import OTP from "./OTP"; //otp verification

//SignUp component - Handles user sign-up functionality.
const SignUp = ({ setSignUpOpen, setSignInOpen }) => {
  const [nameValidated, setNameValidated] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [Loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [credentialError, setCredentialError] = useState("");
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [nameCorrect, setNameCorrect] = useState(false);

  // State to manage password visibility and value
  const [values, setValues] = useState({
    password: "",
    showPassword: false,
  });

  // State to track if an OTP has been sent to the user
  const [otpSent, setOtpSent] = useState(false);
  // State to track if the OTP has been verified
  const [otpVerified, setOtpVerified] = useState(false);

  // Dispatch function to send actions to the Redux store
  const dispatch = useDispatch();

  //  existing form validation and submission logic
  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check if any of the required fields are empty
    if (name === "" || email === "" || password === "") {
      dispatch(
        openSnackbar({
          message: "Please fill all the fields",
          severity: "error",
        })
      );
      return; // Exit the function if validation fails
    }

    try {
      setLoading(true);
      dispatch(loginStart());

      const response = await axios.post("https://teamsync-infosys-internship-oct2024-9gij.vercel.app/user/signup", {
        email,
        name,
        password,
      });

      if (response.status === 201) {
        dispatch(
          openSnackbar({
            message: "Account created successfully. Please verify your OTP.",
            severity: "success",
          })
        );
        setOtpSent(true);
      }
    } catch (error) {
      setLoading(false);
      setDisabled(false);

      if (error.response) {
        const { status, data } = error.response;

        // Handle 400 error for user already exists
        if (status === 400) {
          dispatch(
            openSnackbar({
              message: "User already exists",
              severity: "error",
            })
          );
        } else if (status === 500) {
          dispatch(
            openSnackbar({
              message:
                "Oops! something is up on the server side, Sorry for the inconvenience. Please try again later.",
              severity: "error",
            })
          );
        } else {
          dispatch(loginFailure());
          setCredentialError("An unexpected error occurred. Please try again.");
        }
      } else {
        dispatch(loginFailure());
        setCredentialError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to validate fields and enable/disable the submit button
  useEffect(() => {
    if (email !== "") validateEmail();
    if (password !== "") validatePassword();
    if (name !== "") validateName();
    if (
      name !== "" &&
      validator.isEmail(email) &&
      passwordCorrect &&
      nameCorrect
    ) {
      setDisabled(false); // Enable the submit button
    } else {
      setDisabled(true); // Disable the submit button
    }
  }, [name, email, passwordCorrect, password, nameCorrect]); // Dependencies for the effect

  // Function to create account after OTP verification
  const createAccount = () => {
    if (otpVerified) {
      // Dispatch success snackbar notification if OTP is verified
      dispatch(
        openSnackbar({
          message: "Your account has been verified!",
          severity: "success",
        })
      );
    }
  };

  //validates the entered email.
  const validateEmail = () => {
    if (validator.isEmail(email)) {
      setEmailError("");
    } else {
      setEmailError("Enter a valid Email Id!");
    }
  };

  //  existing password validation logic
  const validatePassword = () => {
    if (password.length < 8) {
      //check minimum length
      setCredentialError("Password must be at least 8 characters long!");
      setPasswordCorrect(false);
    } else if (password.length > 16) {
      //check maximum length
      setCredentialError("Password must be less than 16 characters long!");
      setPasswordCorrect(false);
    } else if (
      !password.match(/[a-z]/g) ||
      !password.match(/[A-Z]/g) ||
      !password.match(/[0-9]/g) ||
      !password.match(/[^a-zA-Z\d]/g) //check pattern
    ) {
      setPasswordCorrect(false);
      setCredentialError(
        "Password must contain at least one lowercase, uppercase, number, and special character!"
      );
    } else {
      setCredentialError("");
      setPasswordCorrect(true);
    }
  };

  //validates the entered name
  const validateName = () => {
    if (name.length < 4) {
      //check minimum length
      setNameValidated(false);
      setNameCorrect(false);
      setCredentialError("Name must be at least 4 characters long!");
    } else {
      setNameCorrect(true);
      if (!nameValidated) {
        setCredentialError("");
        setNameValidated(true);
      }
    }
  };

  // Importing the useTheme hook to access theme-related properties
  const theme = useTheme();

  return (
    // Modal component that opens when the sign-up process is initiated
    <Modal open={true} onClose={() => setSignInOpen(false)}>
      {/* Container for the modal background with a dark overlay */}
      <div className="w-full h-full absolute top-0 left-0 bg-black/70 flex items-center justify-center">
        {/* Main content area of the modal with styling for light and dark themes */}
        <div className="w-[360px] rounded-[30px] bg-white dark:bg-gray-900 text-black dark:text-white p-3 flex flex-col relative">
          {/* Close button for the modal */}
          <CloseRounded
            className="absolute top-6 right-8 cursor-pointer"
            onClick={() => setSignUpOpen(false)}
          />
          {/* Conditional rendering based on whether OTP has been sent */}
          {!otpSent ? (
            <>
              {/* Header for the sign-up form */}
              <h1 className="text-[22px] font-medium text-black dark:text-white mx-7 my-4 text-center">
                Join Teamsync
              </h1>
              <h1 className="text-[13px]  text-black dark:text-blue-500 text-center text-gradient-to-r from-sky-500/20 to-sky-500/75">
                Create an account to join us. 
              </h1>
              {/* Input field for full name */}
              <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 mx-5 my-[3px] text-sm flex justify-center items-center px-4 mt-6">
                <Person className="text-xl mr-3" />
                <input
                  className="w-full border-none text-sm rounded bg-transparent outline-none text-gray-600 dark:text-gray-300"
                  placeholder="Full Name"
                  type="text"
                  onChange={(e) => setName(e.target.value)} // Updating state with the input value
                />
              </div>
              {/* Input field for email */}
              <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 mx-5 my-[3px] text-sm flex justify-center items-center px-4">
                <EmailRounded className="text-xl mr-3" />
                <input
                  className="w-full border-none text-sm rounded bg-transparent outline-none text-gray-600 dark:text-gray-300"
                  placeholder="Email"
                  type="email"
                  onChange={(e) => setEmail(e.target.value)} // Updating state with the input value
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mx-6 my-[2px] mb-2">
                  {emailError}
                </p>
              )}
              {/* Input field for password */}
              <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 mx-5 my-[3px] text-sm flex justify-center items-center px-4">
                <PasswordRounded className="text-xl mr-3" />
                <input
                  className="w-full border-none text-sm rounded bg-transparent outline-none text-gray-600 dark:text-gray-300"
                  placeholder="Password"
                  type={values.showPassword ? "text" : "password"} // Toggle password visibility
                  onChange={(e) => setPassword(e.target.value)} // Updating state with the input value
                />
                {/* Icon button to toggle password visibility */}
                <IconButton
                  color="inherit"
                  onClick={() =>
                    setValues({ ...values, showPassword: !values.showPassword })
                  }
                >
                  {values.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </div>

              {/* Displaying credential error message if applicable */}
              {credentialError && (
                <p className="text-red-500 text-xs mx-6 my-[2px] mb-2">
                  {credentialError}
                </p>
              )}
              {/* Button to submit the sign-up form */}
              <div className="px-5">
                <button
                  onClick={handleSignUp}
                  disabled={disabled}
                  className={`w-full h-11 text-white rounded-md text-base mt-3 transition-colors
                    ${
                      disabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    }`}
                >
                  {Loading ? (
                    <CircularProgress color="inherit" size={24} />
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </div>
              {/* Link to sign in if the user already has an account */}
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mx-5 my-5 mb-10 flex justify-center items-center">
                Already have an account?&nbsp;{" "}
                <span
                  className="text-blue-500 cursor-pointer hover:underline"
                  onClick={() => {
                    setSignInOpen(true); // Opening sign-in modal
                    setSignUpOpen(false); // Closing sign-up modal
                  }}
                >
                  Sign In
                </span>
              </p>
            </>
          ) : (
            // Rendering OTP component if OTP has been sent
            <OTP
              email={email}
              setOtpVerified={setOtpVerified} // Function to verify OTP
              createAccount={createAccount} // Function to create account
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SignUp; // Exporting the SignUp component
