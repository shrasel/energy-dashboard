# Energy Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://www.docker.com/)


Energy Dashboard is a modern, interactive web application for visualizing and analyzing energy consumption and charges. Built with React, Chart.js, and Docker, it provides detailed insights at monthly, daily, hourly, and 15-minute intervals for utility data analysis.

## Features

- 📊 **Multi-Interval Visualization**: View monthly, daily, hourly, and 15-minute breakdowns of energy usage and cost.
- 🖥️ **Interactive Charts**: Bar and line charts with tooltips, legends, and click-to-drill-down navigation.
- 📝 **Summary Cards**: Key metrics including highest month, average cost per kWh, monthly change, and year-to-date totals.
- 🔍 **Insights & Observations**: Automated insights on seasonal patterns, cost efficiency, and recent usage trends.
- 🧩 **Responsive Design**: Optimized for desktop and mobile devices.
- 🐳 **Docker Support**: Easy local and production deployment with Docker and Docker Compose.

## Technology Stack

- React 19
- Chart.js 4
- React Chart.js 2
- Axios
- React Router DOM
- Docker & Docker Compose

## Getting Started

### Prerequisites
- Node.js v16 or newer
- npm or yarn

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/shrasel/energy-dashboard.git
cd energy-dashboard
npm install
```

### Running Locally

```bash
npm start
```
Visit `http://localhost:3000` in your browser.

### Docker Development

```bash
docker compose up -d
```
App runs at `http://localhost:8888` (dev) or `http://localhost:8080` (prod).

## API Requirements

The dashboard expects the following API endpoints:

- **Monthly Data:** `GET /api/data/monthly`
- **Daily Data:** `GET /api/data/daily`
- **Hourly Data:** `GET /api/data/hourly?date=YYYY-MM-DD`

Example response for hourly data:

```json
{
	"data": [
		{
			"from_date": "2025-09-10T00:00:00Z",
			"total_consumption": 1.23,
			"total_charges": 0.45
		},
		// ...more intervals
	]
}
```

## Usage

- Select a month or date range to view daily breakdowns.
- Click any daily bar to drill down to hourly and 15-minute details.
- Review summary cards and insights for quick analysis.

## Environment Variables

You can set environment variables in a `.env` file at the project root:

```
# Example
REACT_APP_API_URL=http://localhost:3000
```

Refer to `docker-compose.yml` for additional variables used in Docker environments.

## Screenshots

<!-- If available, add screenshots here -->
<!-- ![Dashboard Screenshot](./public/dashboard-screenshot.png) -->

## Troubleshooting

- **API not reachable:** Ensure your backend API is running and accessible at the configured URL.
- **Port conflicts:** Change the exposed port in `docker-compose.yml` or `.env` as needed.
- **Chart not rendering:** Check browser console for errors and verify API response format.

## Documentation & Demo

- [React Documentation](https://react.dev/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- <!-- Add link to live demo if available -->

## Project Structure

```
├── public/                # Static assets and index.html
├── src/                   # React source code
│   ├── App.js             # Main dashboard and charts
│   ├── HourlyDetail.js    # Hourly/interval detail view
│   ├── ...                # Other components and styles
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Dev and prod services
├── package.json           # Project metadata and scripts
├── .gitignore             # Files to ignore in git
├── README.md              # Project documentation
```

## Customization

- Update API endpoints in `src/App.js` and `src/HourlyDetail.js` as needed.
- Modify styles in `src/App.css` for branding or layout changes.

## Contributing

Contributions are welcome! Please open an issue to discuss major changes before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

