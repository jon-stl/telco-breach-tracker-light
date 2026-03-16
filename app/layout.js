import './globals.css';

export const metadata = {
  title: 'Telco Cyber Breach Tracker | STL Partners',
  description: 'Tracking major cybersecurity incidents affecting global telecommunications operators.',
  other: {
    'theme-color': '#f0f3f8',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
