import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import SetupView from '../views/SetupView.jsx';

const SetupPresenter = observer(function SetupPresenter() {
  const store = useStore();

  return (
    <SetupView
      username={store.profile.username}
      onUsernameChange={store.setProfileUsername}
      onContinue={() => store.setStep('connect')}
    />
  );
});

export default SetupPresenter;

