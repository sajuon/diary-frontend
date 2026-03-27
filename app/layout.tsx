import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: '해도리 일기',
  description: '해도리와 함께하는 감성 일기 앱',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/images/haedori-character.png',
        media: '(prefers-color-scheme: light)', //라이트모드
      },
      {
        url: '/images/haedori-character.png',
        media: '(prefers-color-scheme: dark)', //다크모드
      },
      {
        url: '/images/haedori-character.png',
        type: 'image/svg+xml', //fallback
      },
    ],
    apple: '/apple-icon.png', //아이폰 홈화면 
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
