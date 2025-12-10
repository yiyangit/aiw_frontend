import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'


export const metadata = {
  title: 'Aihara Workbooks',
  description: '智能题库学习系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}