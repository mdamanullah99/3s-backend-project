import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export default async function sendPhoneOtp(phoneNumber, otp) {
  try {
    const apiKey = process.env.BD_BULK_SMS_API_KEY;
    const senderId = process.env.BD_BULK_SMS_SENDER_ID;
    const message = `Rinaz OTP is ${otp}`;
    const encodedMessage = encodeURIComponent(message);

    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${phoneNumber}&senderid=${senderId}&message=${encodedMessage}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.response_code === 202) {
      console.log(`✅ OTP sent to ${phoneNumber}`);
      return true;
    } else {
      console.log(
        `❌ Failed to send OTP to ${phoneNumber} — Code: ${
          data.response_code
        }, Message: ${data.error_message || data.success_message}`
      );
      return false;
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return false;
  }
}

export async function sendSuccessSMS(phoneNumber, orderId) {
  try {
    const apiKey = process.env.BD_BULK_SMS_API_KEY;
    const senderId = process.env.BD_BULK_SMS_SENDER_ID;
    const message = `Rinaz: Order Placed Successfully, Order ID: ${orderId}`;
    const encodedMessage = encodeURIComponent(message);

    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${phoneNumber}&senderid=${senderId}&message=${encodedMessage}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.response_code === 202) {
      console.log(`✅ Message sent to ${phoneNumber}`);
      return true;
    } else {
      console.log(
        `❌ Failed to send OTP to ${phoneNumber} — Code: ${
          data.response_code
        }, Message: ${data.error_message || data.success_message}`
      );
      return false;
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return false;
  }
}
