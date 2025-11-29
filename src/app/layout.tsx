import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'


export const metadata = {
  title: 'Aihara Workbooks - AI题库软件',
  description: '智能题库学习系统，提供AI答疑功能',
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