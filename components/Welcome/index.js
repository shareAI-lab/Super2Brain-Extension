import StepBar from "./modules/StepBar";
import React, { useState } from "react";
import First from "./step/First";
import Second from "./step/Second";
import FirstRight from "./step/FirstRight";
import SecondRight from "./step/SecondRight";

export default function WelcomeCom() {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState("");

  const handleStepChange = async (step) => {
    if (step > 2) {
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
        return <Second onNext={() => handleStepChange(currentStep + 1)} />;
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
              totalSteps={2}
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
          <FirstRight />
        ) : (
          <FirstRight />
        )}
      </div>
    </div>
  );
}
