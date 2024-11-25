import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import validator from "validator";
import axios from "axios";
import {
  CloseRounded,
  EmailRounded,
  Visibility,
  VisibilityOff,
  PasswordRounded,
} from "@mui/icons-material";
import { IconButton, Modal } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { loginFailure, loginStart, loginSuccess } from "../redux/userSlice";
import { openSnackbar } from "../redux/snackbarSlice";
import OTP from "./OTP";
import ResetPassword from "./ResetPassword";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import {
  userEmailState,
  userIdState,
  isAdminState,
  userNameState,
} from "../store/atoms/authAtoms";
import { jwtDecode } from "jwt-decode";

/**
 * SignIn component handles user authentication and login functionality.
 * It manages local state for email, password, loading status, and error messages.
 * It also integrates with Redux for global state management and Recoil for local state.
 */
const SignIn = ({ setSignInOpen, setSignUpOpen }) => {
  const navigate = useNavigate(); // Hook for navigation
  const setEmailRecoil = useSetRecoilState(userEmailState); // Recoil state for user email
  const setIsAdminRecoil = useSetRecoilState(isAdminState); // Recoil state for admin status
  const setUserIdRecoil = useSetRecoilState(userIdState); // Recoil state for user ID
  const setNameRecoil = useSetRecoilState(userNameState); // Recoil state for user name

  const [email, setEmail] = useState(""); // Local state for email input
  const [password, setPassword] = useState(""); // Local state for password input
  const [Loading, setLoading] = useState(false); // Local state for loading status
  const [disabled, setDisabled] = useState(true); // Local state for button disable status
  const [values, setValues] = useState({
    // Local state for password visibility
    password: "",
    showPassword: false,
  });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false); // Local state for reset password modal
  const [showOTP, setShowOTP] = useState(false); // Local state for OTP visibility
  const [otpVerified, setOtpVerified] = useState(false); // Local state for OTP verification status
  const dispatch = useDispatch(); // Hook for dispatching Redux actions
  const [isAdmin, setIsAdmin] = useState(false); // Local state for admin status
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Local state for login status
  const [userBlocked, setUserBlocked] = useState(false); // Local state for user block status
  const [needsOTPVerification, setNeedsOTPVerification] = useState(false); // Local state for OTP requirement
  const [apiResponse, setApiResponse] = useState(null); // Local state for API response
  const [emailError, setEmailError] = useState(""); // Local state for email error message
  const [credentialError, setcredentialError] = useState(""); // Local state for credential error message

  useEffect(() => {
    if (email !== "") validateEmail(); // Validate email if not empty
    if (validator.isEmail(email) && password.length > 5) {
      setDisabled(false); // Enable button if email is valid and password length is sufficient
    } else {
      setDisabled(true); // Disable button otherwise
    }
  }, [email, password]);

  useEffect(() => {
    if (otpVerified && needsOTPVerification && apiResponse) {
      localStorage.setItem("token", apiResponse.data.token); // Store token in local storage
      dispatch(loginSuccess("Success")); // Dispatch success action
      setIsLoggedIn(true); // Update login status
      setSignInOpen(false); // Close sign-in modal
      dispatch(
        openSnackbar({
          message: "Logged In Successfully", // Show success message
          severity: "success",
        })
      );
    }
  }, [otpVerified, needsOTPVerification, apiResponse]);

  /**
   * handleLogin function manages the login process, including API calls and state updates.
   * It handles various response statuses and updates the UI accordingly.
   */
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!disabled) {
      dispatch(loginStart()); // Dispatch login start action
      setDisabled(true); // Disable button during login
      setLoading(true); // Set loading state

      setUserBlocked(false); // Reset user block status
      setNeedsOTPVerification(false); // Reset OTP requirement
      setcredentialError(""); // Clear credential error

      try {
        const res = await axios.post(
          `${
            isAdmin
              ? "https://teamsync-infosys-internship-oct2024-9gij.vercel.app/admin/signin"
              : "https://teamsync-infosys-internship-oct2024-9gij.vercel.app/user/signin"
          }`,
          { email, password } // Send email and password to API
        );

        setApiResponse(res); // Store API response

        switch (res.status) {
          case 200:
            localStorage.setItem("token", res.data.token); // Store token in local storage
            const decoded = jwtDecode(res.data.token); // Decode JWT token

            setEmailRecoil(decoded.email); // Update Recoil state with email
            setIsAdminRecoil(!!decoded.admin_id); // Update Recoil state with admin status
            setUserIdRecoil(decoded.admin_id || decoded.user_id); // Update Recoil state with user ID
            setNameRecoil(res.data.name); // Update Recoil state with user name
            localStorage.setItem("userName", res.data.name); // Store user name in local storage
            localStorage.setItem("userEmail", decoded.email); // Store user email in local storage
            localStorage.setItem("isAdmin", !!decoded.admin_id); // Store admin status in local storage
            localStorage.setItem("userId", decoded.admin_id || decoded.user_id); // Store user ID in local storage
            localStorage.setItem("userJoindate", res.data.joined_at); // Store join date in local storage
            dispatch(loginSuccess(res.data)); // Dispatch success action with user data
            setIsLoggedIn(true); // Update login status
            setSignInOpen(false); // Close sign-in modal
            dispatch(
              openSnackbar({
                message: "Logged In Successfully", // Show success message
                severity: "success",
              })
            );
            setTimeout(() => {
              console.log(isAdmin);
              if (!isAdmin) {
                navigate("/dashboard/user"); // Navigate to user dashboard
              } else {
                navigate("/dashboard/admin"); // Navigate to admin dashboard
              }
            }, 100);
            break;

          case 401:
            setUserBlocked(true); // Set user block status
            dispatch(loginFailure()); // Dispatch failure action
            setcredentialError(
              "Your account has been blocked. Please contact support."
            ); // Set error message
            dispatch(
              openSnackbar({
                message: "Account blocked", // Show error message
                severity: "error",
              })
            );
            break;

          case 402:
            dispatch(
              openSnackbar({
                message: "Please verify your account", // Show verification message
                severity: "success",
              })
            );
            setNeedsOTPVerification(true); // Set OTP requirement
            setShowOTP(true); // Show OTP component
            break;

          case 400:
            dispatch(loginFailure()); // Dispatch failure action
            setcredentialError(res.data.errors[0]); // Set error message
            dispatch(
              openSnackbar({
                message: `Error: ${res.data.errors[0]}`, // Show error message
                severity: "error",
              })
            );
            break;

          default:
            dispatch(loginFailure()); // Dispatch failure action
            setcredentialError(`Unexpected Error: ${res.data}`); // Set unexpected error message
        }
      } catch (err) {
        console.log(err); // Log error
        if (err.response) {
          switch (err.response.status) {
            case 400:
              setcredentialError("Invalid credentials"); // Set invalid credentials error
              break;
            case 401:
              setUserBlocked(true); // Set user block status
              setcredentialError(
                "Your account has been blocked. Please contact support."
              ); // Set error message
              break;
            case 402:
              setNeedsOTPVerification(true); // Set OTP requirement
              setShowOTP(true); // Show OTP component
              break;
            default:
              setcredentialError(
                err.response.data.errors[0] || "An error occurred"
              ); // Set general error message
          }
        } else {
          setcredentialError("Network error. Please try again."); // Set network error message
        }

        dispatch(loginFailure()); // Dispatch failure action
        dispatch(
          openSnackbar({
            message: credentialError, // Show error message
            severity: "error",
          })
        );
      } finally {
        setLoading(false); // Reset loading state
        setDisabled(false); // Enable button
      }
    }

    if (email === "" || password === "") {
      dispatch(
        openSnackbar({
          message: "Please fill all the fields", // Show error message for empty fields
          severity: "error",
        })
      );
    }
  };

  /**
   * validateEmail function checks if the email is valid and updates the email error state.
   */
  const validateEmail = () => {
    if (validator.isEmail(email)) {
      setEmailError(""); // Clear email error if valid
    } else {
      setEmailError("Enter a valid Email Id!"); // Set email error if invalid
    }
  };

  return !isLoggedIn ? (
    <Modal open={true} onClose={() => setSignInOpen(false)}>
      <div className="w-full h-full absolute top-0 left-0 bg-black/70 flex items-center justify-center">
        {!resetPasswordOpen && (
          <div className="w-[360px] rounded-[30px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 flex flex-col relative">
            <CloseRounded
              className="absolute top-6 right-8 cursor-pointer"
              onClick={() => setSignInOpen(false)} // Close sign-in modal
            />
            {needsOTPVerification && showOTP ? (
              <OTP
                email={email}
                name="User"
                otpVerified={otpVerified}
                setOtpVerified={setOtpVerified}
                reason="LOGIN" // Reason for OTP
              />
            ) : (
              <>
                {/* Header for the sign-in form */}
                <h1 className="text-[22px] font-medium text-black dark:text-white mx-7 my-4 text-center">
                  Welcome back!
                </h1>
                <h1 className="text-[13px]  text-black dark:text-blue-500 text-center text-gradient-to-r from-sky-500/20 to-sky-500/75">
                  It's great to see you again.
                </h1>

                <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 mx-5 my-1 mt-6 flex items-center px-4">
                  <EmailRounded className="text-xl mr-3" />
                  <input
                    className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300"
                    placeholder="Email Id"
                    type="email"
                    onChange={(e) => setEmail(e.target.value)} // Update email state
                  />
                </div>
                {emailError && (
                  <div className="text-red-500 text-xs mx-7 my-0.5">
                    {emailError}
                  </div>
                )}
                <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 mx-5 my-1 flex items-center px-4">
                  <PasswordRounded className="text-xl mr-3" />
                  <input
                    className="w-full bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300"
                    placeholder="Password"
                    type={values.showPassword ? "text" : "password"} // Toggle password visibility
                    onChange={(e) => setPassword(e.target.value)} // Update password state
                  />
                  <IconButton
                    color="inherit"
                    onClick={() =>
                      setValues({
                        ...values,
                        showPassword: !values.showPassword,
                      })
                    } // Toggle show password state
                  >
                    {values.showPassword ? (
                      <Visibility className="text-xl" />
                    ) : (
                      <VisibilityOff className="text-xl" />
                    )}
                  </IconButton>
                </div>
                <div className="h-11 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 mx-5 mt-3 flex items-center px-4">
                  <input
                    type="checkbox"
                    id="admin"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)} // Update admin status
                    className="mr-3"
                  />
                  <label htmlFor="admin">Admin</label>
                </div>
                {credentialError && (
                  <div className="text-red-500 text-xs mx-7 my-0.5">
                    {credentialError}
                  </div>
                )}
                {userBlocked && (
                  <div className="text-red-500 text-xs mx-7 my-0.5">
                    {credentialError}
                  </div>
                )}
                <div
                  className="text-gray-500 dark:text-gray-400 text-sm mx-7 my-2 text-right cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
                  onClick={() => setResetPasswordOpen(true)} // Open reset password modal
                >
                  <b className="hover:underline">Forgot password?</b>
                </div>

                <div className="px-5">
                  <button
                    onClick={handleLogin} // Trigger login on click
                    disabled={disabled} // Disable button if necessary
                    className={`w-full h-11 rounded-md text-white text-base mt-3 transition-colors
                    ${
                      disabled
                        ? "bg-gray-400  text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    }`}
                  >
                    {Loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>

                {/* Link to sign up if the user already has not an account */}
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mx-5 my-5 mb-10 flex justify-center items-center">
                  Don't have an account?&nbsp;{" "}
                  <span
                    className="text-blue-500 cursor-pointer hover:underline"
                    onClick={() => {
                      setSignUpOpen(true); // Opening sign-up modal
                      setSignInOpen(false); // Closing sign-in modal
                    }}
                  >
                    Sign Up
                  </span>
                </p>
              </>
            )}
          </div>
        )}
        {resetPasswordOpen && (
          <ResetPassword
            setResetPasswordOpen={setResetPasswordOpen} // Pass function to close reset password modal
            setSignInOpen={setSignInOpen} // Pass function to close sign-in modal
          />
        )}
      </div>
    </Modal>
  ) : null; // Return null if logged in
};

export default SignIn; // Export SignIn component
