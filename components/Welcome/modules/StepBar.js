export default function StepBar({ currentStep = 1, totalSteps = 2, onChange }) {
  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2 w-full">
        {[...Array(totalSteps)].map((_, index) => (
          <div
            key={index}
            onClick={() => onChange?.(index + 1)}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < currentStep ? "bg-indigo-500" : "bg-indigo-200/70"
            } ${
              index + 1 > currentStep ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
