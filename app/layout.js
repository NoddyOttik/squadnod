// app/layout.js
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import './globals.css';

const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const fontBody = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'SquadNod',
  description: 'Play games and chat with friends in real time',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body className="min-h-screen text-white antialiased">
        {children}
      </body>
    </html>
  );
}
