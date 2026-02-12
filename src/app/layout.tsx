import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://niihut.com'),
  title: {
    template: '%s | Niihut',
    default: 'Niihut - Premier E-commerce Store',
  },
  description: 'Shop the best products at Niihut. Fast delivery across Bangladesh.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Niihut',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
