"use client";

import { useMemo, useState } from "react";

const steps = [
  { label: "Basic Details", icon: "info" },
  { label: "Photos", icon: "image" },
  { label: "Pricing", icon: "payments" },
  { label: "Location", icon: "location_on" },
  { label: "Amenities", icon: "verified_user" },
];

export default function ListYourCavePage() {
  const [step, setStep] = useState(0);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const isFirstStep = step === 0;
  const isLastStep = step === steps.length - 1;

  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const goNext = () => setStep((current) => Math.min(current + 1, steps.length - 1));

  return (
    <main className="min-h-screen bg-background text-on-surface font-body-md text-body-md antialiased pt-32 pb-32 px-6">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <div className="flex flex-col gap-4 mb-4 px-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">
                Step {step + 1} of {steps.length}: {steps[step].label}
              </span>
              <span className="font-label-caps text-label-caps text-secondary">
                {Math.round(progress)}% Complete
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {steps.map((item, index) => {
                const isActive = index === step;
                const isComplete = index < step;

                return (
                  <button
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-2 py-2 text-center transition-all hover:border-primary disabled:cursor-default"
                    disabled={index > step}
                    key={item.label}
                    onClick={() => setStep(index)}
                    type="button"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isActive || isComplete
                          ? "text-primary"
                          : "text-on-surface-variant/50"
                      }`}
                    >
                      {isComplete ? "check_circle" : item.icon}
                    </span>
                    <span
                      className={`hidden sm:inline font-label-caps text-[10px] uppercase ${
                        isActive || isComplete
                          ? "text-primary"
                          : "text-on-surface-variant/50"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-lg p-8 md:p-12 shadow-[0_4px_20px_rgba(15,61,62,0.04)] border border-outline-variant/30">
          {step === 0 && <BasicDetailsStep />}
          {step === 1 && <VisualDocumentationStep />}
          {step === 2 && <PricingStep />}
          {step === 3 && <LocationStep />}
          {step === 4 && <AmenitiesStep />}
        </section>

        <section className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 px-4">
          <button
            className="text-on-surface-variant hover:text-primary font-label-caps text-label-caps transition-colors flex items-center gap-2 uppercase disabled:opacity-40 disabled:hover:text-on-surface-variant"
            disabled={isFirstStep}
            onClick={goBack}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>

          <div className="flex gap-4 items-center w-full md:w-auto">
            <button
              className="flex-1 md:flex-none border border-outline text-primary px-8 py-3 rounded-full font-label-caps text-label-caps hover:bg-surface-container transition-all uppercase"
              type="button"
            >
              Save Draft
            </button>
            <button
              className="flex-1 md:flex-none bg-primary text-white px-12 py-3 rounded-full font-label-caps text-label-caps hover:opacity-90 transition-all uppercase shadow-lg shadow-primary/10"
              onClick={isLastStep ? undefined : goNext}
              type="button"
            >
              {isLastStep ? "Submit Listing" : "Next Step"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function BasicDetailsStep() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          Let&apos;s start with the basics
        </h2>
        <p className="text-on-surface-variant font-body-md text-body-md">
          Define your space and what makes it unique for asset storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Cave Title
          </label>
          <input
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-lg font-h3 transition-colors outline-none"
            placeholder="e.g., Secure Garage in Downtown"
            type="text"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Description
          </label>
          <textarea
            className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-3 text-body-md transition-colors outline-none resize-none"
            placeholder="Describe the serenity, security, and accessibility of your space..."
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
            Storage Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StorageTypeOption icon="garage" label="Garage" />
            <StorageTypeOption icon="house_siding" label="Basement" />
            <StorageTypeOption icon="meeting_room" label="Room" />
            <StorageTypeOption icon="warehouse" label="Warehouse" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StorageTypeOption({ icon, label }: { icon: string; label: string }) {
  return (
    <label className="cursor-pointer">
      <input className="peer hidden" name="type" type="radio" />
      <div className="p-6 border border-outline-variant rounded-md flex flex-col items-center gap-2 peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-primary transition-all text-center">
        <span className="material-symbols-outlined text-h1">{icon}</span>
        <span className="font-label-caps text-label-caps">{label}</span>
      </div>
    </label>
  );
}

function VisualDocumentationStep() {
  const imageSrc =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCHIt43UPBLz2tRqo29v3dPp2m-WCMHLfSSPMGPV35p09S3hXFFsHiVUOsgwTd6f7q7a5W6ZiTVPyRuWN9eFDt_hcifHnoYTkdbYQGLGsCElvtU4BwwVceeme3_Ncmy8PibvBevgM7ZToBItC4kMUKeRQIvGzb07E8gd_H3a6Wp6TqbcBAWMmcvn6JVJTVR03G2vFyeudFQIRMDnxV4W96hyIOvSWR8dcjsMnQYFGmkcBUNq824x3fAkyZjpht9tR-_RPVuw6DQpFc";

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Visual Documentation</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          High-resolution imagery builds trust. Show off the floor quality,
          lighting, and entry points.
        </p>
      </div>

      <div className="w-full border-2 border-dashed border-outline-variant rounded-lg bg-surface-container-low flex flex-col items-center justify-center p-8 md:p-12 gap-2 hover:bg-surface-container transition-colors cursor-pointer group">
        <span className="material-symbols-outlined text-display text-primary/40 group-hover:text-primary transition-colors">
          image
        </span>
        <div className="text-center">
          <p className="font-h3 text-h3 text-primary">
            Upload Storage Photos (Min 3 required)
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Drag &amp; drop or click to browse
          </p>
        </div>
        <button
          className="mt-4 border border-primary text-primary px-8 py-2 rounded-full font-label-caps text-label-caps hover:bg-primary hover:text-white transition-all uppercase"
          type="button"
        >
          Browse Files
        </button>
      </div>

      <div className="flex items-center gap-1 px-1">
        <span className="material-symbols-outlined text-error text-[20px]">error</span>
        <p className="text-body-sm font-semibold text-error">
          At least 3 images required
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <ImagePreview src={imageSrc} primary />
        <ImagePreview src={imageSrc} />
        <ImagePreview src={imageSrc} />
        <div className="aspect-video rounded-md border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container-low/50">
          <span className="material-symbols-outlined text-outline-variant">add</span>
        </div>
      </div>
    </section>
  );
}

function ImagePreview({ src, primary = false }: { src: string; primary?: boolean }) {
  return (
    <div className="group relative aspect-video rounded-md overflow-hidden bg-surface-container border border-outline-variant">
      <img alt="Storage preview" className="w-full h-full object-cover" src={src} />
      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-between items-start">
          <span className="material-symbols-outlined text-white cursor-move">
            drag_indicator
          </span>
          <button className="text-white hover:text-error transition-colors" type="button">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
        <button
          className={`flex items-center gap-1 text-white self-start px-2 py-1 rounded text-[10px] font-label-caps uppercase ${
            primary
              ? "bg-primary/60 backdrop-blur-sm"
              : "hover:bg-white/20 transition-colors border border-white/50"
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[14px]">star</span>
          {primary ? "Primary" : "Set Primary"}
        </button>
      </div>
    </div>
  );
}

function PricingStep() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Monthly Rate</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Consistent income for your underutilized asset.
        </p>
      </div>

      <div className="max-w-xs relative">
        <span className="absolute left-4 top-[34px] -translate-y-1/2 text-h2 text-on-surface-variant font-light">
          $
        </span>
        <input
          className="w-full bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 pl-10 pr-4 py-4 text-display font-display transition-colors outline-none appearance-none"
          placeholder="0.00"
          type="number"
        />

        <div className="mt-4 flex items-start gap-2 p-4 bg-secondary-container/20 rounded-md">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-sm text-on-secondary-container">
            Spaces like yours in <strong>Downtown</strong> typically range from{" "}
            <strong>$250 - $450</strong> per month.
          </p>
        </div>
      </div>
    </section>
  );
}

function LocationStep() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">Location Details</h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Your exact address is only shared after a reservation is confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
              Street Address
            </label>
            <input
              className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
              placeholder="123 Serenity Lane"
              type="text"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                City
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="San Francisco"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-primary uppercase ml-1">
                Zip Code
              </label>
              <input
                className="bg-background border-0 border-b-2 border-outline-variant focus:border-primary focus:ring-0 px-4 py-2 text-body-md outline-none"
                placeholder="94105"
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="w-full h-48 md:h-full min-h-[200px] bg-surface-container rounded-lg relative overflow-hidden border border-outline-variant/30">
          <img
            alt="Map view of San Francisco"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlxL6JAJMx8o4wKXndupHOqqOYuboiyd3aWTtXhVBepGK9TfajebD4-93lJ22S6cvlbYMLRHl6w17R_C6rDlXeztDHZdWyqyOXMyHUesPBMBzM3iPU_DSGViMvtrAo9D1bujZUMdNZwAofPj8gEcFjuYuXUl8soZQ2pbD6t9vWM0fFel4nVtM5vdZLzZMx7sFJ_FgukbtJabFbYWVVRu9UT6s_aJ2nzzw-e1I_NIfYJZNkxX5tmLPou5f3FSBeFHXkyg3bwx_cWZQ"
          />
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-h1 drop-shadow-lg">
              location_on
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AmenitiesStep() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-h2 text-h2 text-primary">
          Amenities &amp; Features
        </h2>
        <p className="text-on-surface-variant font-body-sm text-body-sm">
          Highlight the security and accessibility features that define your
          Cave.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <AmenityOption icon="videocam" label="Security Camera" />
        <AmenityOption icon="schedule" label="24/7 Access" />
        <AmenityOption icon="ac_unit" label="Climate Control" />
        <AmenityOption icon="key" label="Private Entry" />
        <AmenityOption icon="fence" label="Gated" />
        <AmenityOption icon="local_shipping" label="Loading Dock" />
      </div>
    </section>
  );
}

function AmenityOption({ icon, label }: { icon: string; label: string }) {
  return (
    <label className="group flex items-center gap-4 p-6 border border-outline-variant rounded-md cursor-pointer hover:border-secondary transition-all">
      <input className="peer hidden" type="checkbox" />
      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-body-sm text-body-sm font-semibold text-primary">
          {label}
        </p>
      </div>
      <div className="w-5 h-5 rounded border border-outline-variant peer-checked:bg-secondary peer-checked:border-secondary flex items-center justify-center transition-colors">
        <span className="material-symbols-outlined text-white text-[14px] hidden peer-checked:block">
          check
        </span>
      </div>
    </label>
  );
}
