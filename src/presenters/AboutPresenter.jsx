import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreProvider.jsx';
import AboutView from '../views/AboutView.jsx';

const AboutPresenter = observer(function AboutPresenter() {
  const store = useStore();
  return <AboutView onNavigate={store.setStep} />;
});

export default AboutPresenter;
