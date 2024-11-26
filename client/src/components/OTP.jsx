import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { useTheme } from "styled-components";
import OtpInput from "react-otp-input";
import CircularProgress from "@mui/material/CircularProgress";
import { useDispatch } from "react-redux";
import { openSnackbar } from "../redux/snackbarSlice";
import axios from "axios";
import { loginSuccess } from "../redux/userSlice"; // Import loginSuccess action
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirect
import { useSetRecoilState } from "recoil";
import {
  userEmailState,
  userIdState,
  isAdminState,
} from "../store/atoms/authAtoms";
import { jwtDecode } from "jwt-decode";

// Styled component for the Title with specific font properties
const Title = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin: 16px 22px;
`;

// Styled component for an outlined box with various properties and conditional styles
const OutlinedBox = styled.div`
  height: 44px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.soft2};
  color: ${({ theme }) => theme.soft2};
  margin: 3px 20px;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  padding: 0px 14px;
  ${({ googleButton, theme }) =>
    googleButton && `user-select: none; gap: 16px;`}
  ${({ button, theme }) =>
    button &&
    `user-select: none; border: none; background: ${theme.itemHover}; color: '${theme.soft2}';`}
  ${({ activeButton, theme }) =>
    activeButton &&
    `user-select: none; border: none; background: ${theme.primary}; color: white;`}
`;

// Styled component for the Login text with specific font properties
const LoginText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.soft2};
  margin: 0px 26px 0px 26px;
`;

// Styled component for a span element with specific color and font size
const Span = styled.span`
  color: ${({ theme }) => theme.primary};
  font-size: 12px;
  margin: 0px 26px 0px 26px;
`;

// Styled component for displaying error messages with conditional display
const Error = styled.div`
  color: red;
  font-size: 12px;
  margin: 2px 26px 8px 26px;
  display: block;
  ${({ error }) => error === "" && `display: none;`}
`;

// Styled component for a timer display with specific font properties
const Timer = styled.div`
  color: ${({ theme }) => theme.soft2};
  font-size: 12px;
  margin: 2px 26px 8px 26px;
  display: block;
`;

// Styled component for a resend action with specific font properties and cursor style
const Resend = styled.div`
  color: ${({ theme }) => theme.primary};
  font-size: 14px;
  margin: 2px 26px 8px 26px;
  display: block;
  cursor: pointer;
`;

// OTP component for verifying user email with a one-time password
const OTP = ({ email, name, otpVerified, setOtpVerified, reason }) => {
  // Setting up Recoil state management for user email, admin status, and user ID
  const setEmailRecoil = useSetRecoilState(userEmailState);
  const setIsAdminRecoil = useSetRecoilState(isAdminState);
  const setUserIdRecoil = useSetRecoilState(userIdState);

  // Using theme and dispatch from context
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State variables for OTP input, error messages, loading state, and timer
  const [otp, setOtp] = useState(""); // Holds the OTP input value
  const [otpError, setOtpError] = useState(""); // Holds error messages related to OTP
  const [otpLoading, setOtpLoading] = useState(false); // Indicates if OTP submission is in progress
  const [disabled, setDisabled] = useState(true); // Controls the disabled state of the submit button
  const [showTimer, setShowTimer] = useState(false); // Controls the visibility of the timer
  const [otpSent, setOtpSent] = useState(false); // Indicates if OTP has been sent
  const [timer, setTimer] = useState("00:00"); // Holds the timer value

  const Ref = useRef(null); // Reference for the timer interval

  // Function to calculate remaining time for the OTP timer
  const getTimeRemaining = (e) => {
    const total = Date.parse(e) - Date.parse(new Date()); // Calculate total time remaining
    const seconds = Math.floor((total / 1000) % 60); // Calculate seconds
    const minutes = Math.floor((total / 1000 / 60) % 60); // Calculate minutes
    return { total, minutes, seconds }; // Return time remaining
  };

  // Function to start the timer
  const startTimer = (e) => {
    let { total, minutes, seconds } = getTimeRemaining(e); // Get remaining time
    if (total >= 0) {
      // Format and set the timer display
      setTimer(
        (minutes > 9 ? minutes : "0" + minutes) +
          ":" +
          (seconds > 9 ? seconds : "0" + seconds)
      );
    }
  };

  // Function to clear and reset the timer
  const clearTimer = (e) => {
    setTimer("01:00"); // Reset timer to 1 minute
    if (Ref.current) clearInterval(Ref.current); // Clear existing interval
    const id = setInterval(() => {
      startTimer(e); // Start the timer
    }, 1000); // Update every second
    Ref.current = id; // Store interval ID
  };

  // Function to get the deadline for the OTP timer
  const getDeadTime = () => {
    let deadline = new Date(); // Create a new date object
    deadline.setSeconds(deadline.getSeconds() + 60); // Set deadline to 60 seconds from now
    return deadline; // Return the deadline
  };

  // Function to resend the OTP
  const resendOtp = () => {
    setShowTimer(true); // Show the timer
    clearTimer(getDeadTime()); // Clear and reset the timer
    sendOtp(); // Send a new OTP
  };

  // Function to send the OTP to the user's email
  const sendOtp = async () => {
    try {
      const response = await axios.post("https://teamsync-infosys-internship-oct2024-9gij.vercel.app/user/verify", {
        email,
      }); // Send OTP request
      if (response.status === 200) {
        // If successful, show success message
        dispatch(
          openSnackbar({
            message: "OTP sent Successfully",
            severity: "success",
          })
        );
        setDisabled(true); // Disable the submit button
        setOtp(""); // Clear OTP input
        setOtpError(""); // Clear any existing error messages
        setOtpLoading(false); // Reset loading state
        setOtpSent(true); // Mark OTP as sent
      } else {
        // If not successful, show error message
        dispatch(
          openSnackbar({
            message: response.status,
            severity: "error",
          })
        );
        setOtp(""); // Clear OTP input
        setOtpError(""); // Clear any existing error messages
        setOtpLoading(false); // Reset loading state
      }
    } catch (err) {
      // Handle any errors during the OTP request
      dispatch(
        openSnackbar({
          message: err.message,
          severity: "error",
        })
      );
    }
  };

  // Function to validate the entered OTP
  const validateOtp = async () => {
    setOtpLoading(true); // Set loading state to true
    setDisabled(true); // Disable the submit button
    try {
      const response = await axios.put("https://teamsync-infosys-internship-oct2024-9gij.vercel.app/user/verify", {
        email: email,
        registerOtp: otp, // Send the OTP for validation
      });

      if (response.status === 200) {
        const token = response.data.token; // Get the token from the response

        dispatch(loginSuccess({ token })); // Dispatch login success action
        localStorage.setItem("token", token); // Store token in local storage

        const decoded = jwtDecode(response.data.token); // Decode the token
        setEmailRecoil(decoded.email); // Set email in Recoil state
        setIsAdminRecoil(!!decoded.admin_id); // Set admin status in Recoil state
        setUserIdRecoil(decoded.admin_id || decoded.user_id); // Set user ID in Recoil state
        localStorage.setItem("userName", response.data.name); // Store user name in local storage
        localStorage.setItem("userEmail", decoded.email); // Store user email in local storage
        localStorage.setItem("userJoindate", response.data.joined_at); // Store user join date in local storage
        //set localstorage item userId for admin or user as per recieved
        localStorage.setItem("userId", decoded.admin_id || decoded.user_id);
        
        setOtpVerified(true); // Mark OTP as verified
        setOtp(""); // Clear OTP input
        setOtpError(""); // Clear any existing error messages
        setDisabled(false); // Enable the submit button
        dispatch(
          openSnackbar({
            message: "OTP verified successfully!", // Show success message
            severity: "success",
          })
        );
        setTimeout(() => {
          if (!decoded.admin_id) {
            navigate("/dashboard/user"); // Navigate to user dashboard if not admin
          }
        }, 100);
      } else {
        setOtpLoading(false); // Reset loading state
        setDisabled(false); // Enable the submit button
        setOtpError(response.data.message); // Set error message
        dispatch(
          openSnackbar({
            message: response.data.message, // Show error message
            severity: "error",
          })
        );
      }
    } catch (err) {
      // Handle errors during OTP validation
      dispatch(
        openSnackbar({
          message: "Enter a valid otp", // Show error message
          severity: "error",
        })
      );
      setOtpError("Enter a valid otp"); // Set error message
    } finally {
      // Ensure loading state is reset in all cases
      setOtpLoading(false); // Reset loading state
      setDisabled(false); // Enable the submit button
    }
  };

  // Initial effect to send OTP and start the timer
  useEffect(() => {
    sendOtp(); // Send OTP on component mount
    clearTimer(getDeadTime()); // Start the timer
  }, []);

  // Effect to manage timer visibility
  useEffect(() => {
    if (timer === "00:00") {
      setShowTimer(false); // Hide timer when it reaches zero
    } else {
      setShowTimer(true); // Show timer if time is remaining
    }
  }, [timer]);

  // Effect to enable/disable submit button based on OTP length
  useEffect(() => {
    if (otp.length === 6) {
      setDisabled(false); // Enable button if OTP is 6 characters
    } else {
      setDisabled(true); // Disable button otherwise
    }
  }, [otp]);

  // Render the OTP verification component
  return (
    <div>
      <Title>VERIFY OTP</Title> {/* Title of the component */}
      <LoginText>
        A verification <b>&nbsp;OTP &nbsp;</b> has been sent to:
      </LoginText>{" "}
      {/* Instruction text */}
      <Span>{email}</Span> {/* Display the email to which OTP was sent */}
      {!otpSent ? (
        <div
          style={{
            padding: "12px 26px",
            marginBottom: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            justifyContent: "center",
          }}
        >
          Sending OTP
          <CircularProgress color="inherit" size={20} />{" "}
          {/* Loading indicator while sending OTP */}
        </div>
      ) : (
        <div>
          <OtpInput
            value={otp} // Bind OTP input value
            onChange={setOtp} // Update OTP state on change
            numInputs={6} // Number of input fields for OTP
            shouldAutoFocus={true} // Autofocus on the first input
            inputStyle={{
              fontSize: "22px",
              width: "38px",
              height: "38px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              textAlign: "center",
              margin: "6px 4px",
              backgroundColor: "transparent",
              color: theme.text,
            }} // Style for OTP input
            containerStyle={{ padding: "8px 2px", justifyContent: "center" }} // Style for input container
            renderInput={(props) => <input {...props} />} // Render custom input
          />
          <Error error={otpError}>
            <b>{otpError}</b>
          </Error>{" "}
          {/* Display error message if any */}
          <OutlinedBox
            button={true} // Indicate this is a button
            activeButton={!disabled} // Enable button based on disabled state
            style={{ marginTop: "12px", marginBottom: "12px" }} // Style for the button
            onClick={validateOtp} // Validate OTP on button click
          >
            {otpLoading ? (
              <CircularProgress color="inherit" size={20} /> // Show loading indicator if OTP is being validated
            ) : (
              "Submit" // Button text
            )}
          </OutlinedBox>
          {showTimer ? (
            <Timer>
              Resend in <b>{timer}</b>
            </Timer> // Display timer for resending OTP
          ) : (
            <Resend onClick={resendOtp}>
              <b>Resend</b>
            </Resend> // Resend button if timer is not visible
          )}
        </div>
      )}
    </div>
  );
};

export default OTP; // Export the OTP component
