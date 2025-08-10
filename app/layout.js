import './globals.css'

export const metadata = {
  title: 'FlowPort Dashboard',
  description: 'Migration and visualization dashboard for FlowPort',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
