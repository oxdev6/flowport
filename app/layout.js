import './globals.css'

export const metadata = {
  title: 'Arbitrum Onboard & Explore',
  description: 'Migrate in Minutes. Understand in Seconds. Migration + Visualizer suite for Arbitrum.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
