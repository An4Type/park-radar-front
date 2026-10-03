import { createAnimation, type AnimationBuilder } from '@ionic/react';

export const fadeTransition: AnimationBuilder = (_baseEl, opts) => {
  const entering = createAnimation()
    .addElement(opts.enteringEl)
    .beforeRemoveClass('ion-page-invisible')
    .fromTo('opacity', '0', '1');

  const root = createAnimation().duration(240).easing('cubic-bezier(0.2, 0.8, 0.2, 1)').addAnimation(entering);

  if (opts.leavingEl) {
    root.addAnimation(createAnimation().addElement(opts.leavingEl).fromTo('opacity', '1', '0'));
  }
  return root;
};
