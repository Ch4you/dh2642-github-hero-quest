import { StoreProvider } from './models/StoreProvider.jsx';
import RootPresenter from './presenters/RootPresenter.jsx';

export default function App() {
  return (
    <StoreProvider>
      <RootPresenter />
    </StoreProvider>
  );
}

