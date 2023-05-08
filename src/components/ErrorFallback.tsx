import React from 'react';
import PPStorage from '../PPStorage';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ color: 'white' }}>
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={() => PPStorage.getInstance().saveNewGraph()}>
        Save a backup
      </button>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default ErrorFallback;
