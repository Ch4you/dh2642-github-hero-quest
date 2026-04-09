import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import LandingView from '../views/LandingView.jsx';

const LoginPresenter = observer(function LoginPresenter() {
  const store = useStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authPhase, setAuthPhase] = useState('Opening GitHub authorization...');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <LandingView
      isAuthenticating={isAuthenticating}
      authPhase={authPhase}
      errorMessage={errorMessage}
      onContinue={async () => {
        setErrorMessage('');
        setAuthPhase('Opening GitHub authorization...');
        setIsAuthenticating(true);
        try {
          await store.signInWithGitHub((phase) => setAuthPhase(phase));
        } catch (error) {
          setErrorMessage(error?.message ?? 'GitHub sign-in failed. Please check Firebase Auth settings.');
        } finally {
          setIsAuthenticating(false);
        }
      }}
    />
  );
});

export default LoginPresenter;

