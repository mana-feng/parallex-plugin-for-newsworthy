// API Configuration
// Change the port here if you need to use a different port (e.g., 3002)
const API_PORT = 3001; // Change to 3002 if port 3001 is occupied

export const API_BASE_URL = `http://localhost:${API_PORT}/api`;

// Helper function to build API URLs
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// Export the port for reference
export { API_PORT };


