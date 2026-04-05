import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import LandingView from '../views/LandingView.jsx';

const LoginPresenter = observer(function LoginPresenter() {
  const store = useStore();
  return <LandingView onContinue={() => store.setStep('setup')} />;
});

export default LoginPresenter;

