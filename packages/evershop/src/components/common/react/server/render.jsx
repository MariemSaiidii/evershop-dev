import { AppProvider } from '@components/common/context/app';
import ServerHtml from '@components/common/react/server/Server';
import React from 'react';
import { renderToString } from 'react-dom/server';

function renderHtml(js, css, contextData, langeCode) {
  const source = renderToString(
    <AppProvider value={JSON.parse(contextData)}>
      <ServerHtml
        js={js}
        css={css}
        appContext={`var eContext = ${contextData}`}
      />
    </AppProvider>
  );

  return `<!DOCTYPE html><html id="root" lang="${langeCode}">${source}</html>`;
}

export { renderHtml };
