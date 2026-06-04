'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle2, Eye, EyeOff, FileText, Home, IdCard, Lock, Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthDownloadCard } from '@/components/auth-download-card';
import { toast } from 'sonner';

type SignupRole = 'user' | 'driver';
type SignupStep = 'role' | 'basic' | 'details' | 'security';

const STEP_ORDER: SignupStep[] = ['role', 'basic', 'details', 'security'];

const STEP_META: Record<SignupStep, { number: number; title: string; description: string; icon: typeof Users }> = {
  role: {
    number: 1,
    title: 'Account type',
    description: 'Choose whether you are signing up as a rider or a driver.',
    icon: Users,
  },
  basic: {
    number: 2,
    title: 'Basic details',
    description: 'Add your identity, contact details, location, and profile photo.',
    icon: UserRound,
  },
  details: {
    number: 3,
    title: 'Profile details',
    description: 'Add emergency and, for drivers, vehicle and payout information.',
    icon: FileText,
  },
  security: {
    number: 4,
    title: 'Security',
    description: 'Create your password and review everything before signing up.',
    icon: ShieldCheck,
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignupStep>('role');
  const [role, setRole] = useState<SignupRole | ''>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureName, setProfilePictureName] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [operatingZones, setOperatingZones] = useState('');
  const [unionName, setUnionName] = useState('');
  const [vehiclePicture, setVehiclePicture] = useState<File | null>(null);
  const [vehiclePictureName, setVehiclePictureName] = useState('');
  const [licensePicture, setLicensePicture] = useState<File | null>(null);
  const [licensePictureName, setLicensePictureName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepMeta = STEP_META[currentStep];
  const completedSteps = useMemo(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    return STEP_ORDER.filter((step) => STEP_ORDER.indexOf(step) < currentIndex);
  }, [currentStep]);

  const updateStep = (step: SignupStep) => {
    setCurrentStep(step);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void, nameSetter: (name: string) => void) => {
    const file = event.target.files?.[0] || null;
    setter(file);
    nameSetter(file?.name || '');
  };

  const validateStep = (step: SignupStep) => {
    switch (step) {
      case 'role':
        if (!role) {
          toast.error('Choose whether you are signing up as a rider or a driver.');
          return false;
        }
        return true;
      case 'basic':
        if (!firstName || !lastName || !email || !phone || !homeAddress) {
          toast.error('Complete your basic details before continuing.');
          return false;
        }
        return true;
      case 'details':
        if (!emergencyContactName || !emergencyContactPhone) {
          toast.error('Add an emergency contact before continuing.');
          return false;
        }

        if (role === 'driver') {
          if (!vehicleType || !plateNumber || !operatingZones || !unionName || !bankName || !bankAccountNumber) {
            toast.error('Complete the driver details before continuing.');
            return false;
          }
        }

        return true;
      case 'security':
        if (!password || !confirmPassword) {
          toast.error('Create and confirm your password.');
          return false;
        }

        if (password.length < 8) {
          toast.error('Password must be at least 8 characters long.');
          return false;
        }

        if (password !== confirmPassword) {
          toast.error('Passwords do not match.');
          return false;
        }

        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
      return;
    }

    router.back();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep !== 'security') {
      handleNext();
      return;
    }

    if (!validateStep('security')) {
      return;
    }

    if (!role) {
      toast.error('Choose your account type before creating an account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('homeAddress', homeAddress);
      if (workAddress) {
        formData.append('workAddress', workAddress);
      }
      formData.append('emergencyContactName', emergencyContactName);
      formData.append('emergencyContactPhone', emergencyContactPhone);
      if (referralCode) {
        formData.append('referralCode', referralCode);
      }
      formData.append('password', password);
      formData.append('role', role);

      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      if (role === 'driver') {
        formData.append('vehicleType', vehicleType);
        formData.append('plateNumber', plateNumber);
        formData.append('operatingZones', operatingZones);
        formData.append('unionName', unionName);
        formData.append('bankName', bankName);
        formData.append('bankAccountNumber', bankAccountNumber);

        if (vehiclePicture) {
          formData.append('vehiclePicture', vehiclePicture);
        }

        if (licensePicture) {
          formData.append('licensePicture', licensePicture);
        }
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      toast.success('Account created', {
        description: 'Your full profile has been saved. Sign in to continue.',
      });

      router.push('/auth/login');
    } catch (error) {
      toast.error('Signup failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9203]/5 via-white to-[#C57711]/10 px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="border-orange-200/70 shadow-2xl shadow-orange-200/20 dark:border-orange-900/40">
          <CardHeader className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 self-center sm:self-start rounded-full bg-[#FF9203]/10 px-4 py-2 text-sm font-semibold text-[#8D5308] dark:bg-[#633B06]/20 dark:text-[#FFE4C0]">
              <ShieldCheck className="h-4 w-4" />
              Web signup
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-[#7A4603] dark:text-[#FFE7C7]">Create your account in steps</CardTitle>
              <CardDescription className="mt-2 text-base text-orange-700/80 dark:text-orange-100/80">
                We collect the same essentials as the mobile onboarding flow so your profile is ready for rides, payouts, and support.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-4">
                {STEP_ORDER.map((step) => {
                  const meta = STEP_META[step];
                  const isActive = currentStep === step;
                  const isCompleted = completedSteps.includes(step);
                  const Icon = meta.icon;

                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => updateStep(step)}
                      className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-[#FF9203] bg-[#FF9203]/10' : isCompleted ? 'border-orange-300 bg-orange-50/80' : 'border-orange-100 bg-white/70'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCompleted ? 'bg-[#FF9203] text-white' : 'bg-white text-[#C57711]'}`}>
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Step {meta.number}</p>
                          <p className="font-semibold text-[#7A4603]">{meta.title}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-sm shadow-orange-100/40">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C57711]">{currentStepMeta.title}</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#7A4603]">{currentStepMeta.description}</h2>
                  </div>
                  <div className="hidden rounded-2xl bg-[#FF9203]/10 p-3 text-[#C57711] sm:block">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                {currentStep === 'role' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`rounded-2xl border p-5 text-left transition ${role === 'user' ? 'border-[#FF9203] bg-[#FF9203]/10' : 'border-orange-100 bg-orange-50/70 hover:border-orange-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white p-2 text-[#FF9203] shadow-sm">
                          <Home className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-[#7A4603]">Rider</p>
                          <p className="text-sm text-orange-700/80">Book rides, save addresses, and receive trip updates.</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={`rounded-2xl border p-5 text-left transition ${role === 'driver' ? 'border-[#FF9203] bg-[#FF9203]/10' : 'border-orange-100 bg-orange-50/70 hover:border-orange-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white p-2 text-[#FF9203] shadow-sm">
                          <IdCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-[#7A4603]">Driver</p>
                          <p className="text-sm text-orange-700/80">Set up your vehicle, payout, and dispatch details.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {currentStep === 'basic' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} className="h-12 pl-10" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" autoComplete="email" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 pl-10" autoComplete="tel" required />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="homeAddress">Home address</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="homeAddress" value={homeAddress} onChange={(event) => setHomeAddress(event.target.value)} className="h-12 pl-10" placeholder="Enter where you live" required />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="workAddress">Work address <span className="text-muted-foreground">(optional)</span></Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input id="workAddress" value={workAddress} onChange={(event) => setWorkAddress(event.target.value)} className="h-12 pl-10" placeholder="Where do you work?" />
                      </div>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="profilePicture">Profile photo <span className="text-muted-foreground">(optional)</span></Label>
                      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#FF9203] shadow-sm">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Input id="profilePicture" type="file" accept="image/*" onChange={(event) => handleFileChange(event, setProfilePicture, setProfilePictureName)} className="h-12" />
                          <p className="text-xs text-muted-foreground">Add a clear photo so support and drivers can recognize your account.</p>
                          {profilePictureName ? <p className="text-xs font-medium text-[#7A4603]">Selected: {profilePictureName}</p> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'details' && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="emergencyContactName">Emergency contact name</Label>
                        <Input id="emergencyContactName" value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} className="h-12" required />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="emergencyContactPhone">Emergency contact phone</Label>
                        <Input id="emergencyContactPhone" value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} className="h-12" required />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="referralCode">Referral code <span className="text-muted-foreground">(optional)</span></Label>
                        <Input id="referralCode" value={referralCode} onChange={(event) => setReferralCode(event.target.value)} className="h-12" placeholder="If someone referred you, add the code here" />
                      </div>
                    </div>

                    {role === 'driver' && (
                      <div className="space-y-5 rounded-3xl border border-orange-100 bg-orange-50/60 p-5">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C57711]">Driver details</p>
                          <p className="mt-1 text-sm text-orange-800/80">These values support driver dispatching, verification, and payouts.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="vehicleType">Vehicle type</Label>
                            <Input id="vehicleType" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} className="h-12" placeholder="e.g. Keke, Tricycle" required />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="plateNumber">Plate number</Label>
                            <Input id="plateNumber" value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} className="h-12" placeholder="Vehicle plate number" required />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="operatingZones">Operating zones</Label>
                            <Input id="operatingZones" value={operatingZones} onChange={(event) => setOperatingZones(event.target.value)} className="h-12" placeholder="Comma-separated areas, e.g. Yaba, Ojota, Ikeja" required />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unionName">Union name</Label>
                            <Input id="unionName" value={unionName} onChange={(event) => setUnionName(event.target.value)} className="h-12" placeholder="Driver union" required />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank name</Label>
                            <Input id="bankName" value={bankName} onChange={(event) => setBankName(event.target.value)} className="h-12" placeholder="Bank used for payouts" required />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="bankAccountNumber">Bank account number</Label>
                            <Input id="bankAccountNumber" value={bankAccountNumber} onChange={(event) => setBankAccountNumber(event.target.value)} className="h-12" placeholder="Payout account number" required />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="vehiclePicture">Vehicle photo <span className="text-muted-foreground">(optional)</span></Label>
                            <Input id="vehiclePicture" type="file" accept="image/*" onChange={(event) => handleFileChange(event, setVehiclePicture, setVehiclePictureName)} className="h-12" />
                            {vehiclePictureName ? <p className="text-xs font-medium text-[#7A4603]">Selected: {vehiclePictureName}</p> : null}
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="licensePicture">License photo <span className="text-muted-foreground">(optional)</span></Label>
                            <Input id="licensePicture" type="file" accept="image/*" onChange={(event) => handleFileChange(event, setLicensePicture, setLicensePictureName)} className="h-12" />
                            {licensePictureName ? <p className="text-xs font-medium text-[#7A4603]">Selected: {licensePictureName}</p> : null}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                      Your profile details are stored during signup so you do not need a second profile-completion step later.
                    </div>
                  </div>
                )}

                {currentStep === 'security' && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="h-12 pl-10 pr-10"
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="h-12 pl-10 pr-10"
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                      Review your details, then submit to create the account. We will use the same profile for web sign-in and mobile access.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={handleBack} className="h-12 border-orange-200 text-[#7A4603] hover:bg-orange-50">
                  Back
                </Button>

                {currentStep !== 'security' ? (
                  <Button type="submit" className="h-12 bg-[#FF9203] text-white hover:bg-[#E68900]">
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" className="h-12 bg-[#FF9203] text-white hover:bg-[#E68900]" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-[#C57711] hover:underline">
                Sign in
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </CardFooter>
        </Card>

        <AuthDownloadCard
          title="Download the app, too"
          description="After signing up on the web, install the app to keep everything synced, from location tracking to ride updates and push alerts."
        />
      </div>
    </main>
  );
}
