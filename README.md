# Statistical Process Control (SPC) Application

A Looker extension application that enables Statistical Process Control analysis within the Looker platform. This application allows users to perform SPC analysis on their data by selecting time dimensions and measures from their LookML models.

## Features

- Interactive selection of LookML models and explores
- Dynamic field selection for time dimensions and measures
- Real-time SPC analysis visualization
- Creates repeatable table calculations for SPC analysis

## Development Prerequisites

- Node.js (version specified in `.nvmrc`)
- Looker instance
- Looker extension framework enabled

## Marketplace Installation

- Navigate to the Looker Marketplace and click Manage
- In the three dot menu select "Install via Git URL"
- Enter the following URL: `https://github.com/lkrdev/statistical-process-control.git`
- Enter `main` in the git commit SHA field
- Install the application
- Set the connection to any connection you have access to
- You can now use the application in your Looker instance by refreshing the page and navigating to Statistical Process Control under Applications

## Development


1. Clone the repository:
```bash
git clone https://github.com/lkrdev/statistical-process-control.git
cd statistical-process-control
```

2. Install dependencies:
```bash
npm install
```

To run the application in development mode run the following `npm` command. Change your manifest's application url to `https://localhost:8080/bundle.js`

```bash
# Run with HTTP
npm run dev:https
```

## Building for Production

```bash
npm run build
```

## Project Structure

- `src/` - Source code directory
  - `components/` - React components
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions
  - `AppContext.tsx` - Main application context and state management
  - `Explore.tsx` - Explore selection and configuration
  - `FieldTree.tsx` - Field selection tree component
  - `Sidebar.tsx` - Application sidebar
  - `SPCButton.tsx` - SPC analysis trigger component

## Dependencies

- React 17
- Looker Extension SDK
- Looker Components
- Styled Components
- SWR for data fetching
- TypeScript

## Configuration

The application is configured through the `manifest.lkml` file, which defines:
- Application name and label
- URL for the bundled application
- Required entitlements and permissions

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
