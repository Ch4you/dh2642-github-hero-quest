import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import LandingView from '../views/LandingView.jsx';

const LoginPresenter = observer(function LoginPresenter() {
  const store = useStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <LandingView
      isAuthenticating={isAuthenticating}
      errorMessage={errorMessage}
      onContinue={async () => {
        setErrorMessage('');
        setIsAuthenticating(true);
        try {
          await store.signInWithGitHub();
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

