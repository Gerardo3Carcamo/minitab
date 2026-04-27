export interface TourStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
  };
}

export async function startGuidedTour(steps: TourStep[]): Promise<void> {
  const filteredSteps = steps.filter((step) => !step.element || document.querySelector(step.element));
  if (filteredSteps.length === 0) {
    return;
  }

  const driverModule = await import('driver.js');
  const driverInstance = driverModule.driver({
    animate: true,
    showProgress: true,
    allowClose: true,
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText: 'Listo',
    steps: filteredSteps
  });

  driverInstance.drive();
}
