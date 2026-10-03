import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AppProviders } from './app/AppProviders';
import { AppShell } from './app/AppShell';

import '@ionic/react/css/core.css';

import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

import '@fontsource-variable/figtree';
import './theme/tokens.css';
import './theme/variables.css';
import './theme/global.css';

setupIonicReact({ mode: 'ios', swipeBackEnabled: false });

const App: React.FC = () => (
  <IonApp>
    <AppProviders>
      <IonReactRouter>
        <AppShell />
      </IonReactRouter>
    </AppProviders>
  </IonApp>
);

export default App;
