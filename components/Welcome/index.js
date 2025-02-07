import StepBar from "./modules/StepBar";
import React from "react";
import First from "./step/First";
import Second from "./step/Second";
import SecondRight from "./step/SecondRight";
import FirstRight from "./step/FirstRight";

import PinExtension from "./step/PinExtension";
import PinExtensionRight from "./step/PinExtensionRight";

export default function WelcomeCom() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [apiKey, setApiKey] = React.useState("");
  
  const handleStepChange = async (step) => {
    if (step > 3) {
      window.close();
      return;
    }
    setCurrentStep(step);
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <First
            apiKey={apiKey}
            setApiKey={setApiKey}
            onNext={() => handleStepChange(currentStep + 1)}
          />
        );
      case 2:
        return (
          <PinExtension onNext={() => handleStepChange(currentStep + 1)} />
        );
      case 3:
        return <Second onNext={() => handleStepChange(currentStep + 1)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 w-full h-full">
      <div className="w-[40%] bg-white pl-24 py-24">
        <div className="w-full max-w-xl">
          <div className="mb-16">
            <h1 className="text-2xl font-bold mb-12 text-left">👋 欢迎使用</h1>
            <StepBar
              currentStep={currentStep}
              totalSteps={3}
              onChange={handleStepChange}
            />
          </div>
          {renderStepComponent()}
        </div>
      </div>
      <div className="w-[60%] bg-[#dcecf7] p-8">
        {currentStep === 3 ? (
          <SecondRight />
        ) : currentStep === 2 ? (
          <PinExtensionRight />
        ) : (
          <FirstRight />
        )}
      </div>
    </div>
  );
}
