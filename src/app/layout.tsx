import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Graveyard — Where Ventures Come to Rest",
  description: "A 3D memorial graveyard for all the dead startups. Navigate through tombstones and explore the stories of failed ventures and the billions lost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
