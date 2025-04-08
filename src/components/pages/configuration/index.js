import { useState, useEffect } from "react";
import axios from "axios";

const Configuration = () => {
  const [thresholdData, setThresholdData] = useState({
    windSpeed: "",
    temperature: "",
    humidity: "",
    rain_gauge: "",
    windDirection: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "success", "error", "info"

  useEffect(() => {
    fetchThresholdData();
  }, []);

  const fetchThresholdData = async () => {
    try {
      const response = await axios.get("http://localhost:5002/api/weather-thresold");
      if (response.data.success) {
        setThresholdData(response.data.result.data);
      }
    } catch (error) {
      setMessage("Error fetching data");
      setMessageType("error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setThresholdData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = thresholdData.id ? "put" : "post";
      const response = await axios[method](
        "http://localhost:5002/api/weather-thresold",
        thresholdData
      );
      if (response.data.success) {
        setMessage(response.data.result.message);
        setMessageType("success");
        if (!thresholdData.id) {
          setThresholdData(response.data.result.data);
        }
      }
    } catch (error) {
      setMessage("Error saving data");
      setMessageType("error");
    }
    setLoading(false);
  };

  const getMessageStyles = () => {
    switch (messageType) {
      case "success":
        return "bg-green-50 text-green-700 border-green-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const InputField = ({ label, name, type, value, step, placeholder }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type || "text"}
        name={name}
        value={value}
        onChange={handleInputChange}
        step={step}
        placeholder={placeholder}
        required
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-indigo-600 py-4 px-6">
            <h2 className="text-2xl font-bold text-white">
              Weather Threshold Configuration
            </h2>
            <p className="text-indigo-100 mt-1">
              Set alert thresholds for weather parameters
            </p>
          </div>

          {message && (
            <div className={`m-6 p-4 rounded-lg border ${getMessageStyles()}`}>
              {message}
            </div>
          )}

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Wind Speed (m/s)"
                  name="windSpeed"
                  type="number"
                  value={thresholdData.windSpeed}
                  step="0.1"
                  placeholder="Enter wind speed threshold"
                />

                <InputField
                  label="Temperature (°C)"
                  name="temperature"
                  type="number"
                  value={thresholdData.temperature}
                  step="0.1"
                  placeholder="Enter temperature threshold"
                />

                <InputField
                  label="Humidity (%)"
                  name="humidity"
                  type="number"
                  value={thresholdData.humidity}
                  placeholder="Enter humidity threshold"
                />

                <InputField
                  label="Rain Gauge (mm)"
                  name="rain_gauge"
                  type="number"
                  value={thresholdData.rain_gauge}
                  step="0.1"
                  placeholder="Enter rain threshold"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wind Direction
                </label>
                <select
                  name="windDirection"
                  value={thresholdData.windDirection}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                >
                  <option value="">Select Direction</option>
                  <option value="N">North</option>
                  <option value="NE">North East</option>
                  <option value="E">East</option>
                  <option value="SE">South East</option>
                  <option value="S">South</option>
                  <option value="SW">South West</option>
                  <option value="W">West</option>
                  <option value="NW">North West</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Thresholds"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;