import "./globals.css";

export const metadata = {
  title: "DubStudio Pro - Timecode & Timeline",
  description: "Herramienta de timecodes y guión técnico para doblaje",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
