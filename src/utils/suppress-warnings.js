// Suppress defaultProps warnings from Semantic UI React
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;

  console.warn = (...args) => {
    const message = args[0];

    if (
      typeof message === 'string' &&
      message.includes('Support for defaultProps will be removed')
    ) {
      // Suppress defaultProps warnings
      return;
    }

    originalConsoleWarn(...args);
  };
}