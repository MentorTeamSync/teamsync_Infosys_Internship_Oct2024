const sgMail = require('@sendgrid/mail');
dotenv = require('dotenv');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
console.log("SendGrid API Key (Masked):", process.env.SENDGRID_API_KEY ? "Exists" : "Missing");


const sendOtpEmail = async (recipientEmail, otp, message) => {
    const msg = {
        to: recipientEmail,
        from: 'noreply.teamsync@gmail.com', 
        subject: 'Vroomify OTP Verification',
        text: `${message} ${otp}`,
        html: `<strong>${message} ${otp}</strong>`,
    };

    try {
        const response = await sgMail.send(msg);
        console.log("SendGrid Response:", response[0].statusCode, response[0].headers);
    } catch (error) {
        console.error("Error sending email via SendGrid:", error.response?.body || error.message);
    }
};

// Export the sendOtpEmail function for use in other parts of the application
module.exports = { sendOtpEmail };