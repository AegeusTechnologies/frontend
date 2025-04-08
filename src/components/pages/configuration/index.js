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
      const response = await axios[method]("http://localhost:5002/api/weather-thresold", thresholdData);
      if (response.data.success) {
        setMessage(response.data.result.message);
        if (!thresholdData.id) {
          setThresholdData(response.data.result.data);
        }
      }
    } catch (error) {
      setMessage("Error saving data");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Weather Threshold Configuration</h2>
        {message && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Wind Speed (m/s)</label>
            <input
              type="number"
              name="windSpeed"
              value={thresholdData.windSpeed}
              onChange={handleInputChange}
              step="0.1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
            <input
              type="number"
              name="temperature"
              value={thresholdData.temperature}
              onChange={handleInputChange}
              step="0.1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Humidity (%)</label>
            <input
              type="number"
              name="humidity"
              value={thresholdData.humidity}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rain Gauge (mm)</label>
            <input
              type="number"
              name="rain_gauge"
              value={thresholdData.rain_gauge}
              onChange={handleInputChange}
              step="0.1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Wind Direction</label>
            <select
              name="windDirection"
              value={thresholdData.windDirection}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? "Saving..." : "Save Thresholds"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Configuration;