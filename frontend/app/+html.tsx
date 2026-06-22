import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, interactive-widget=resizes-content, viewport-fit=cover, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="white" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <style dangerouslySetInnerHTML={{ __html: keyboardStyles }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #faf1e4;
}

*, *::before, *::after {
  box-sizing: border-box;
}
button, input {
  font-family: inherit;
  font-size: inherit;
}
@media (max-width: 520px) {
  .hide-mobile { display: none !important; }
}
html, body, #root {
  height: 100%;
  height: 100dvh;
  margin: 0;
  overflow: hidden;
}
body {
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
`;

const keyboardStyles = `
input, textarea {
  font-size: 16px;
}

@supports (padding: max(0px)) {
  html, body, #root {
    padding-left: max(env(safe-area-inset-left, 0), env(safe-area-inset-right, 0));
    padding-right: max(env(safe-area-inset-left, 0), env(safe-area-inset-right, 0));
  }
}

@media (max-height: 600px) {
  html, body, #root {
    height: 100vh;
  }
}
`;
