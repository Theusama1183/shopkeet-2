"use client";

import { useState, useEffect } from "react";
import { createStore, checkSubdomain } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    description: "",
    plan: "standard",
  });
  
  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1
              key="step1"
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <Step2
              key="step2"
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 3 && (
            <Step3 key="step3" formData={formData} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step1({ formData, setFormData, onNext }: any) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      if (!formData.subdomain || formData.subdomain.length < 3) {
        setAvailable(null);
        setError("");
        return;
      }
      setChecking(true);
      setError("");
      const res = await checkSubdomain(formData.subdomain);
      setChecking(false);
      setAvailable(res.available);
      if (!res.available) setError(res.error || "Subdomain taken");
    };

    const debounce = setTimeout(check, 500);
    return () => clearTimeout(debounce);
  }, [formData.subdomain]);

  const disabled = !formData.name || !formData.subdomain || available === false || checking;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex min-h-screen"
    >
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white border-r border-slate-200">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-[64px] font-heading font-semibold leading-tight text-zinc-900">
              Name your empire.
            </h1>
            <p className="text-[28px] text-zinc-500 font-sans mt-2">
              This will be your permanent subdomain.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Store Name</label>
              <Input
                placeholder="My Awesome Store"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                  setFormData({ ...formData, name, subdomain: slug });
                }}
                className="text-lg py-6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Subdomain</label>
              <div className="flex items-center">
                <Input
                  placeholder="my-store"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  className="rounded-l-none text-lg h-12"
                />
                <span className="p-3 bg-zinc-100 border border-r-0 border-slate-200 rounded-l-md text-zinc-500 font-medium h-12 flex items-center">
                  .shopkeet.com
                </span>
              </div>
              <div className="mt-2 h-6 flex items-center text-sm font-medium">
                {checking && <span className="text-zinc-500 flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> Checking...</span>}
                {!checking && available === true && <span className="text-violet-600 flex items-center gap-1"><Check className="w-4 h-4"/> Subdomain available</span>}
                {!checking && available === false && <span className="text-red-500">{error}</span>}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full text-lg py-6 mt-8 bg-violet-500 hover:bg-violet-600"
              onClick={onNext}
              disabled={disabled}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right: Preview (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-100 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
        <Card className="w-[400px] h-[500px] shadow-xl border-slate-200 bg-white relative z-10 flex flex-col">
            <div className="h-8 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"/>
                <div className="w-3 h-3 rounded-full bg-yellow-400"/>
                <div className="w-3 h-3 rounded-full bg-green-400"/>
                <div className="ml-4 bg-zinc-100 px-2 py-0.5 rounded text-xs text-zinc-400 w-full text-center">
                    {formData.subdomain || "your-store"}.shopkeet.com
                </div>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                    <Store className="w-8 h-8"/>
                </div>
                <div>
                     <h3 className="text-xl font-bold">{formData.name || "Store Name"}</h3>
                     <p className="text-zinc-500">Your store description goes here.</p>
                </div>
                <div className="w-full space-y-2 mt-8">
                    <div className="h-24 bg-zinc-50 rounded-lg border border-dashed border-zinc-200"/>
                    <div className="h-24 bg-zinc-50 rounded-lg border border-dashed border-zinc-200"/>
                </div>
            </div>
        </Card>
      </div>
    </motion.div>
  );
}

function Step2({ formData, setFormData, onNext, onBack }: any) {
  const plans = [
    { id: "basic", name: "Basic", price: "$5.99", features: ["1 Store", "100 Products", "Basic Support"] },
    { id: "standard", name: "Standard", price: "$19.99", features: ["5 Stores", "1000 Products", "Priority Support"], popular: true },
    { id: "golden", name: "Golden", price: "$39.99", features: ["Unlimited Stores", "Unlimited Products", "24/7 Dedicated Support"] },
  ];

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="min-h-screen flex flex-col items-center justify-center p-8"
    >
      <div className="text-center mb-12">
        <h1 className="text-[48px] font-heading font-semibold text-zinc-900">Choose your growth.</h1>
        <p className="text-xl text-zinc-500 mt-2">Pick a plan that fits your business needs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "p-8 cursor-pointer transition-all hover:shadow-lg relative border-2",
              formData.plan === plan.id ? "border-violet-500 shadow-lg" : "border-transparent hover:border-violet-200"
            )}
            onClick={() => setFormData({ ...formData, plan: plan.id })}
          >
            {plan.popular && (
                <div className="absolute top-0 right-0 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-sm uppercase tracking-wide">
                    Popular
                </div>
            )}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="text-4xl font-bold font-heading">{plan.price}<span className="text-lg font-normal text-zinc-500">/mo</span></div>
              <ul className="space-y-3 py-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-zinc-600">
                    <Check className="w-4 h-4 text-violet-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={formData.plan === plan.id ? "primary" : "outline"}
                className={cn("w-full", formData.plan === plan.id ? "bg-violet-500" : "")}
                onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, plan: plan.id });
                    onNext();
                }}
              >
                Start 7-Day Free Trial
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-12">
          <button onClick={onBack} className="text-zinc-500 hover:text-zinc-900 font-medium">
              Back to Store Identity
          </button>
      </div>
    </motion.div>
  );
}

function Step3({ formData }: any) {
  const [status, setStatus] = useState("init");

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1000));
      setStatus("db");
      await new Promise(r => setTimeout(r, 1500));
      setStatus("store");
      await new Promise(r => setTimeout(r, 1500));
      setStatus("ready");
      
      // Submit
      const form = new FormData();
      form.append("name", formData.name);
      form.append("subdomain", formData.subdomain);
      form.append("description", formData.description);
      
      const res = await createStore(null, form);
      if (res?.error) {
          alert(res.error); 
          // Handle error (maybe go back?)
      } else {
          // Success
          const protocol = window.location.protocol;
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
          const storeUrl = `${protocol}//${res.subdomain}.${rootDomain}`;
          window.location.href = storeUrl;
      }
    };
    sequence();
  }, []);

  const steps = [
      { id: "db", label: "Setting up database" },
      { id: "store", label: "Configuring Store" },
      { id: "ready", label: "Ready" }
  ];

  return (
    <motion.div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-zinc-50">
       <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse"/>
       </div>
       
       <div className="z-10 text-center space-y-8">
           <h1 className="text-[64px] font-heading font-semibold text-zinc-900">
               Building your storefront...
           </h1>
           
           <div className="flex flex-col items-center gap-4">
               {steps.map((s, i) => (
                   <div key={s.id} className="h-8 flex items-center justify-center">
                       {/* Show based on status progression */}
                       {(status === s.id || (status === "ready" && s.id !== "ready") || (status === "store" && s.id === "db")) && (
                           <motion.span
                                initial={{ filter: "blur(10px)", opacity: 0, y: 10 }}
                                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                                className={cn(
                                    "text-2xl font-medium",
                                    status === s.id ? "text-violet-600" : "text-zinc-400"
                                )}
                           >
                               {status === s.id && <Loader2 className="inline w-5 h-5 animate-spin mr-2"/>}
                               {s.label}
                               {status !== s.id && status !== "init" && i < steps.findIndex(x => x.id === status) && <Check className="inline w-5 h-5 ml-2 text-green-500"/>}
                           </motion.span>
                       )}
                   </div>
               ))}
           </div>
       </div>
    </motion.div>
  );
}
