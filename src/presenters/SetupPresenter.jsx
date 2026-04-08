import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import SetupView from '../views/SetupView.jsx';

const SetupPresenter = observer(function SetupPresenter() {
  const store = useStore();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  return (
    <SetupView
      username={store.profile.username}
      onUsernameChange={(value) => {
        store.setProfileUsername(value);
        if (error) setError('');
      }}
      errorMessage={error}
      continueDisabled={pending}
      onContinue={async () => {
        setError('');
        setPending(true);
        try {
          await store.validateProfileAndContinue();
        } catch (e) {
          setError(
            e?.message?.includes('404')
              ? 'GitHub user not found. Check the username.'
              : (e?.message ?? 'Could not verify GitHub username.'),
          );
        } finally {
          setPending(false);
        }
      }}
    />
  );
});

export default SetupPresenter;
