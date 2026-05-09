import { StoreProvider } from './stores/StoreProvider.jsx';
import RootPresenter from './presenters/RootPresenter.jsx';

export default function App() {
  return (
    <StoreProvider>
      <RootPresenter />
    </StoreProvider>
  );
}
