/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/stories/*.stories.{ts,tsx}',
  defaultStory: 'button--primary',
  appendToHead: `
    <style>
      body {
        font-family: var(--nis-font-body), system-ui, sans-serif;
      }
      .ladle-aside { background: #0a0a0a; }
      .nis-light, .nis-dark {
        padding: 32px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
        justify-content: flex-start;
      }
      .nis-dark { background: #0a0a0a; color: #fafafa; }
      .nis-light {
        background: #faf7ff;
        background-image:
          radial-gradient(900px 600px at 12% 30%, rgba(124,58,237,0.10), transparent 60%),
          radial-gradient(800px 500px at 88% 110%, rgba(236,72,153,0.08), transparent 60%);
        color: #1a0f37;
      }
    </style>
  `,
};
