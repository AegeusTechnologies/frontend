import { useState, useEffect } from "react";
import axios from "axios";

const Configuration = () => {
  const [thresholdData, setThresholdData] = useState({
    rain_gauge: "",
    wind_speed: "",
    wind_speed_level: "",
    wind_direction: "",
    wind_direction_angle: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    fetchThresholdData();
  }, []);

  const fetchThresholdData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/weather-thresold`);
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
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/weather-thresolds`,
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

  const InputField = ({ label, name, type, value, step, placeholder, icon }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
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
        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 py-6 px-6 sm:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🌤️</span>
              Weather Threshold Configuration
            </h2>
            <p className="text-indigo-100 mt-2 text-sm sm:text-base">
              Set alert thresholds for weather parameters
            </p>
          </div>

          {message && (
            <div className={`m-6 p-4 rounded-lg border ${getMessageStyles()}`}>
              <div className="flex items-center gap-2">
                {messageType === "success" && <span>✅</span>}
                {messageType === "error" && <span>❌</span>}
                {messageType === "info" && <span>ℹ️</span>}
                {message}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InputField
                  label="Rain Gauge (mm)"
                  name="rain_gauge"
                  type="number"
                  value={thresholdData.rain_gauge}
                  step="0.1"
                  placeholder="Enter rain threshold"
                  icon="🌧️"
                />
                <InputField
                  label="Wind Speed (m/s)"
                  name="wind_speed"
                  type="number"
                  value={thresholdData.wind_speed}
                  step="0.1"
                  placeholder="Enter wind speed threshold"
                  icon="💨"
                />
                <InputField
                  label="Wind Speed Level"
                  name="wind_speed_level"
                  type="number"
                  value={thresholdData.wind_speed_level}
                  step="1"
                  placeholder="Enter wind speed level"
                  icon="📊"
                />
                <InputField
                  label="Wind Direction Angle (°)"
                  name="wind_direction_angle"
                  type="number"
                  value={thresholdData.wind_direction_angle}
                  step="0.1"
                  placeholder="Enter wind direction angle"
                  icon="🧭"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">🧭</span>
                  Wind Direction
                </label>
                <select
                  name="wind_direction"
                  value={thresholdData.wind_direction}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                >
                  <option value="">Select Direction</option>
                  <option value="N">🔼 North</option>
                  <option value="NE">↗️ North East</option>
                  <option value="E">▶️ East</option>
                  <option value="SE">↘️ South East</option>
                  <option value="S">🔽 South</option>
                  <option value="SW">↙️ South West</option>
                  <option value="W">◀️ West</option>
                  <option value="NW">↖️ North West</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      💾 Save Thresholds
                    </span>
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