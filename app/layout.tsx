import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ResumeForge - One-Page ATS-Ready Resume Builder',
  description: 'Transform any resume into a polished, one-page, ATS-ready format with interactive editing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

