import axios from "axios";

let shiprocketToken = "";
let tokenExpiry: number = 0; // Store as timestamp in ms

export const setToken = (token: string, expiresIn: number) => {
  shiprocketToken = token;
  tokenExpiry = Date.now() + expiresIn * 1000; // expiresIn is in seconds
};

export const getToken = () => {
  if (Date.now() >= tokenExpiry) return null;
  return shiprocketToken;
};

export const getValidShiprocketToken = async () => {
  try {
    const token = getToken();
    if (token) return token;

    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    console.log({ response }, "Shiprocket token generated");

    const { token: newToken } = response.data;
    // Set token with 10-day expiry (864000 seconds)
    setToken(newToken, 864000);
    return newToken;
  } catch (error) {
    console.log(error);
    console.log("Shiprocket token generation failed");
    throw error;
  }
};
