'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Briefcase, ExternalLink, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaLinkedinIn } from 'react-icons/fa6';
import { z } from 'zod';

const calculatorSchema = z.object({
  leadsPerMonth: z.preprocess((value) => Number(value), z.number().min(1)),
  dealValue: z.preprocess((value) => Number(value), z.number().min(1)),
  conversionRate: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return 0.3;
    }
    return Number(value);
  }, z.number().min(0).max(1)),
  responseDelay: z.string().min(1),
});

const emailSchema = z.object({
  email: z.string().email(),
  consent: z.boolean().optional(),
});

type CalculatorValues = z.infer<typeof calculatorSchema>;
type EmailValues = z.infer<typeof emailSchema>;

type Step =
  | 'hero'
  | 'calculator'
  | 'email'
  | 'analyzing'
  | 'result'
  | 'booking'
  | 'footer';

const responseOptions = [
  { value: 'under5min', label: 'Under 5 Minutes' },
  { value: '5to30min', label: '5 to 30 Minutes' },
  { value: '30minTo4h', label: '30 Minutes to 4 Hours' },
  { value: '4to24h', label: '4 to 24 Hours' },
  { value: 'over24h', label: 'Over 24 Hours' },
];

const calendlyUrl =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  'https://calendly.com/revenueops-team/15-minute-revenue-audit';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatNumber(value: number) {
  return currency.format(value);
}

export default function RevenueFunnel() {
  const [step, setStep] = useState<Step>('hero');
  const [calcPayload, setCalcPayload] = useState<CalculatorValues | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const calculator = useForm<CalculatorValues>({
    resolver: zodResolver(calculatorSchema) as any,
    defaultValues: {
      leadsPerMonth: '' as any,
      dealValue: '' as any,
      conversionRate: 0.3,
      responseDelay: '',
    },
  });

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      consent: true,
    },
  });

  const leadsPerMonthValue = Number(calculator.watch('leadsPerMonth'));
  const dealValueNumber = Number(calculator.watch('dealValue'));
  const conversionRateValue = Number(calculator.watch('conversionRate'));
  const responseDelayValue = String(calculator.watch('responseDelay'));

  const canRevealDeal = leadsPerMonthValue > 0;
  const canRevealConversion = canRevealDeal && dealValueNumber > 0;
  const canRevealResponse = canRevealConversion;

  const calcResult = useMemo(() => {
    if (!calcPayload) return null;
    const decayMultipliers: Record<string, number> = {
      under5min: 1.0,
      '5to30min': 0.4,
      '30minTo4h': 0.15,
      '4to24h': 0.05,
      over24h: 0.02,
    };
    const D = decayMultipliers[calcPayload.responseDelay] || 0;
    const potentialRevenue =
      calcPayload.leadsPerMonth *
      calcPayload.conversionRate *
      calcPayload.dealValue;
    const capturedRevenue = potentialRevenue * D;
    const revenueLeak = potentialRevenue - capturedRevenue;

    return {
      revenueLeak,
    };
  }, [calcPayload]);

  const onCalculatorSubmit = (values: CalculatorValues) => {
    setCalcPayload(values);
    setStep('email');
  };

  const onEmailSubmit = async (values: EmailValues) => {
    if (!calcPayload) return;

    setIsSubmitting(true);
    setApiMessage(null);

    try {
      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...calcPayload,
          email: values.email,
          consent: !!values.consent,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setApiMessage(
          result?.error ?? 'There was an issue saving your report.'
        );
      } else {
        setApiMessage(
          result?.message ?? 'Report sent successfully to your email.'
        );
      }
    } catch (error) {
      setApiMessage('Could not connect to the reporting API.');
    } finally {
      setIsSubmitting(false);
      setStep('analyzing');
      setTimeout(() => setStep('result'), 3200);
    }
  };

  const handleStartOver = () => {
    setStep('hero');
    calculator.reset();
    emailForm.reset();
    setCalcPayload(null);
    setApiMessage(null); // Reset API message
  };

  return (
    <main className='relative isolate bg-gradient-to-b from-background via-slate-900/20 to-background text-foreground'>
      {/* NAVBAR */}
      <nav className='fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo and Brand Name */}
            <div
              className='flex items-center gap-2 cursor-pointer'
              onClick={() => setStep('hero')}
            >
              <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20'>
                <Sparkles className='w-5 h-5 text-white' />
              </div>
              <span className='text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent'>
                SERVEVELIO
              </span>
            </div>

            {/* Navigation Links */}
            <div className='flex items-center gap-4 sm:gap-6'>
              <a
                href='/portfolio'
                className='flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-purple-300 transition-colors'
              >
                <Briefcase className='w-4 h-4' />
                <span className='hidden sm:inline'>Portfolio</span>
              </a>
              <a
                href='https://www.linkedin.com/in/elias-a-91085218b'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-purple-300 transition-colors'
              >
                <FaLinkedinIn className='w-4 h-4' />
                <span className='hidden sm:inline'>LinkedIn</span>
              </a>
              <button
                onClick={() => setStep('calculator')}
                className='hidden sm:block px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-semibold hover:bg-purple-500/20 transition-all'
              >
                Get Audit
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode='wait'>
        {/* HERO SECTION */}
        {step === 'hero' && (
          <motion.section
            key='hero'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
              <div className='absolute bottom-0 left-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
            </div>

            <div className='relative z-10 max-w-4xl mx-auto w-full'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className='text-center space-y-8'
              >
                <div className='inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 backdrop-blur-sm'>
                  <Sparkles className='w-4 h-4 text-purple-300' />
                  <span className='text-xs sm:text-sm font-semibold text-purple-200'>
                    Revenue Recovery for High-Growth Operators
                  </span>
                </div>

                <div className='space-y-6'>
                  <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight'>
                    <span className='block text-white mb-2'>
                      Every Minute Your Ads Run
                    </span>
                    <span className='block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent'>
                      Without a Response
                    </span>
                    <span className='block text-white mt-2'>
                      You're Losing Money
                    </span>
                  </h1>

                  <div className='space-y-4 max-w-2xl mx-auto'>
                    <p className='text-lg sm:text-xl text-purple-200 font-semibold'>
                      Stop the "Lead Leak."
                    </p>
                    <p className='text-base sm:text-lg text-slate-300 leading-relaxed'>
                      We bridge the gap between your ad spend and your bank
                      account with high-speed follow-up and swift sales
                      operations.
                    </p>
                    <p className='text-sm sm:text-base text-slate-400 leading-relaxed'>
                      You're spending thousands on Meta and LinkedIn to find
                      customers. But if a lead comments on your post or fills
                      out your form and waits 4 hours for a reply, they've
                      already moved on to your competitor.
                    </p>
                    <p className='text-lg sm:text-xl text-purple-300 font-semibold pt-2'>
                      The Lead Response Gap is the #1 killer of ROI.
                    </p>
                    <p className='text-base text-slate-300'>
                      Want to see the exact dollar amount slipping through your
                      fingers? Use the tool below.
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={() => setStep('calculator')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 px-8 sm:py-5 sm:px-10 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/40 text-base sm:text-lg'
                >
                  Calculate My Revenue Leak
                  <ArrowRight className='w-5 h-5 sm:w-6 sm:h-6' />
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* CALCULATOR SECTION */}
        {step === 'calculator' && (
          <motion.section
            key='calculator'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-y-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl' />
            </div>

            <div className='relative z-10 w-full max-w-5xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'
              >
                {/* Left Column - Inputs */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className='space-y-6'
                >
                  <div className='space-y-2'>
                    <h2 className='text-4xl sm:text-5xl font-bold'>
                      The Revenue Recovery Calculator
                    </h2>
                    <p className='text-sm sm:text-base text-slate-400'>
                      Fill in your metrics to see your exact revenue leak
                    </p>
                  </div>

                  <div className='space-y-5'>
                    <div className='space-y-2'>
                      <label className='block text-sm font-semibold text-slate-200'>
                        Average Monthly Lead Volume
                      </label>
                      <input
                        type='number'
                        {...calculator.register('leadsPerMonth')}
                        placeholder='500'
                        className='w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-base font-medium'
                      />
                      {calculator.formState.errors.leadsPerMonth && (
                        <p className='text-sm text-red-400 font-medium'>
                          {calculator.formState.errors.leadsPerMonth.message}
                        </p>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canRevealDeal ? 1 : 0.5 }}
                      className='space-y-2'
                    >
                      <label className='block text-sm font-semibold text-slate-200'>
                        Average Deal Value (LTV)
                      </label>
                      <input
                        type='number'
                        {...calculator.register('dealValue')}
                        placeholder='5000'
                        disabled={!canRevealDeal}
                        className='w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium'
                      />
                      {calculator.formState.errors.dealValue && (
                        <p className='text-sm text-red-400 font-medium'>
                          {calculator.formState.errors.dealValue.message}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canRevealResponse ? 1 : 0.5 }}
                      className='space-y-2'
                    >
                      <label className='block text-sm font-semibold text-slate-200'>
                        Current Average Response Time (Estimated)
                      </label>
                      <select
                        {...calculator.register('responseDelay')}
                        disabled={!canRevealResponse}
                        className='w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium'
                      >
                        <option value=''>Select response time</option>
                        {responseOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {calculator.formState.errors.responseDelay && (
                        <p className='text-sm text-red-400 font-medium'>
                          {calculator.formState.errors.responseDelay.message}
                        </p>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Right Column - Live Preview */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className='relative flex flex-col justify-center'
                >
                  <div className='rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 space-y-6'>
                    <div className='space-y-2'>
                      <h3 className='text-xl sm:text-2xl font-bold text-white'>
                        Live Potential Revenue
                      </h3>
                      <p className='text-sm text-slate-400'>
                        Based on your inputs above
                      </p>
                    </div>

                    <div className='space-y-1'>
                      <p className='text-4xl sm:text-5xl font-bold text-purple-400'>
                        {formatNumber(
                          leadsPerMonthValue *
                            dealValueNumber *
                            conversionRateValue
                        )}
                      </p>
                      <p className='text-xs sm:text-sm text-slate-500'>
                        Estimated monthly revenue at 100% efficiency
                      </p>
                    </div>

                    <div className='pt-4 border-t border-white/10'>
                      <p className='text-sm text-slate-300 italic'>
                        "The faster you respond, the more you close. It's that
                        simple."
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.form
                onSubmit={calculator.handleSubmit(onCalculatorSubmit)}
                className='mt-8'
              >
                <motion.button
                  type='submit'
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 sm:py-5 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg shadow-purple-500/40'
                >
                  {isSubmitting ? 'Processing...' : 'Show Me the Numbers'}
                </motion.button>

                {apiMessage && (
                  <p className='text-sm sm:text-base text-slate-300 text-center font-medium mt-4'>
                    {apiMessage}
                  </p>
                )}
              </motion.form>
            </div>
          </motion.section>
        )}

        {/* EMAIL SECTION */}
        {step === 'email' && (
          <motion.section
            key='email'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl' />
            </div>

            <div className='relative z-10 w-full max-w-xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-6 sm:p-10 space-y-8 shadow-2xl'
              >
                <div className='text-center space-y-3'>
                  <h2 className='text-3xl sm:text-4xl font-bold'>
                    Almost there!
                  </h2>
                  <p className='text-slate-400 text-sm sm:text-base'>
                    Where should we send your detailed revenue leak diagnosis?
                  </p>
                </div>

                <form
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className='space-y-6'
                >
                  <div className='space-y-2'>
                    <label className='block text-sm font-semibold text-slate-200'>
                      Business Email
                    </label>
                    <input
                      type='email'
                      {...emailForm.register('email')}
                      placeholder='you@company.com'
                      className='w-full px-4 py-3 sm:px-5 sm:py-4 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-base font-medium'
                    />
                    {emailForm.formState.errors.email && (
                      <p className='text-sm text-red-400 font-medium'>
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className='flex items-start gap-3'>
                    <input
                      type='checkbox'
                      {...emailForm.register('consent')}
                      className='mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500/30 cursor-pointer'
                    />
                    <p className='text-xs sm:text-sm text-slate-400 leading-tight'>
                      I agree to receive my revenue report and occasional
                      high-performance sales insights.
                    </p>
                  </div>

                  <motion.button
                    type='submit'
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 sm:py-5 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-base sm:text-lg shadow-lg shadow-purple-500/40'
                  >
                    {isSubmitting ? 'Processing...' : 'Get My Diagnosis'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ANALYZING SECTION */}
        {step === 'analyzing' && (
          <motion.section
            key='analyzing'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-blue-900/20' />
            </div>

            <div className='relative z-10 w-full max-w-3xl mx-auto text-center'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-8'
              >
                <h2 className='text-4xl sm:text-5xl font-bold'>
                  Analyzing your revenue leak...
                </h2>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {[
                    'Calculating lost revenue…',
                    'Analyzing response gaps…',
                    'Preparing your diagnosis…',
                  ].map((label, idx) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className='rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-4 sm:p-6'
                    >
                      <p className='text-slate-300 text-sm sm:text-base mb-4 font-medium'>
                        {label}
                      </p>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-slate-800'>
                        <motion.div
                          className='h-full bg-gradient-to-r from-purple-500 to-blue-500'
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2.5, ease: 'easeInOut' }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* RESULT SECTION */}
        {step === 'result' && (
          <motion.section
            key='result'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-y-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
              <div className='absolute bottom-0 left-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
            </div>

            <div className='relative z-10 w-full max-w-5xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-6'
              >
                {/* Header */}
                <div className='text-center space-y-3'>
                  <h2 className='text-4xl sm:text-5xl font-bold'>
                    Your Estimated Monthly Revenue Leak
                  </h2>
                </div>

                {/* Main Result Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className='rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 text-center space-y-4'
                >
                  <motion.p
                    key={calcResult?.revenueLeak}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className='text-6xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
                  >
                    {calcResult ? formatNumber(calcResult.revenueLeak) : '$0'}
                  </motion.p>
                  <p className='text-slate-300 text-base sm:text-lg max-w-xl mx-auto'>
                    This is the revenue you're losing every month due to slow
                    response times.
                  </p>
                </motion.div>

                {/* Convincer Copy */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='rounded-xl border border-slate-700 bg-slate-800/30 p-6 sm:p-8 text-center space-y-3'
                >
                  <p className='text-lg sm:text-xl font-bold text-white'>
                    This isn't just a number; it's a structural failure in your
                    sales process.
                  </p>
                  <p className='text-base sm:text-lg text-slate-300'>
                    If you aren't first, you're last.
                  </p>
                </motion.div>

                {/* What We Do */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className='grid grid-cols-1 md:grid-cols-3 gap-4'
                >
                  {[
                    {
                      title: 'Instant Follow-Up',
                      desc: 'We monitor your ad responses swiftly. When a lead pings, we answer in under 3 minutes.',
                    },
                    {
                      title: 'Sales & Conversion',
                      desc: "We don't just 'talk', we move your leads through high-conversion scripts to close the deal.",
                    },
                    {
                      title: 'Engagement & Retention',
                      desc: 'We keep your leads warm with precision micro-copy related to your business and services so they stay, pay, get upsold and refer.',
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className='rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-5 sm:p-6 space-y-3'
                    >
                      <h3 className='text-base sm:text-lg font-bold text-white'>
                        {item.title}
                      </h3>
                      <p className='text-sm sm:text-base text-slate-300 leading-relaxed'>
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setStep('booking')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 sm:py-5 rounded-lg transition-all duration-300 text-base sm:text-lg shadow-lg shadow-purple-500/40'
                >
                  Continue to Book Your Audit
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* BOOKING SECTION */}
        {step === 'booking' && (
          <motion.section
            key='booking'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl -translate-y-1/2' />
            </div>

            <div className='relative z-10 w-full max-w-3xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='text-center space-y-8'
              >
                <div className='space-y-4'>
                  <h2 className='text-4xl sm:text-5xl font-bold'>
                    Ready to Turn "Ghost Revenue" into Banked Profit?
                  </h2>
                  <p className='text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed'>
                    I have cleared 30 minutes on my calendar to walk you through
                    a custom Revenue Recovery roadmap for your company. No sales
                    pitch, just a tactical blueprint to stop the leak.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 space-y-6'
                >
                  <div className='space-y-2'>
                    <h3 className='text-2xl sm:text-3xl font-bold text-white'>
                      Book Your 30-Minute Revenue Audit
                    </h3>
                    <p className='text-sm sm:text-base text-slate-300'>
                      So we can dive straight into the fix.
                    </p>
                  </div>

                  <motion.a
                    href={calendlyUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 sm:py-5 px-8 sm:px-10 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/40 text-base sm:text-lg'
                  >
                    Schedule Your Call
                    <ExternalLink className='w-5 h-5 sm:w-6 sm:h-6' />
                  </motion.a>
                </motion.div>

                <motion.button
                  onClick={() => setStep('footer')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='text-slate-400 hover:text-slate-300 text-sm sm:text-base font-semibold transition-colors'
                >
                  or continue to finish
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* FOOTER SECTION */}
        {step === 'footer' && (
          <motion.section
            key='footer'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-blue-900/20' />
            </div>

            <div className='relative z-10 w-full max-w-3xl mx-auto text-center space-y-8'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-4'
              >
                <h2 className='text-4xl sm:text-5xl font-bold'>
                  Managed Operations for High-Growth Firms.
                </h2>
                <p className='text-base sm:text-lg text-slate-300'>
                  Your revenue recovery starts now.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='flex flex-col sm:flex-row gap-4 justify-center items-center text-sm sm:text-base'
              >
                <a
                  href='/privacy-policy'
                  className='text-purple-300 hover:text-purple-200 font-semibold transition-colors'
                >
                  Privacy Policy
                </a>
              </motion.div>

              <motion.button
                onClick={handleStartOver}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 sm:py-5 px-8 sm:px-10 rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/40 text-base sm:text-lg'
              >
                Start Over
                <ArrowRight className='w-5 h-5 sm:w-6 sm:h-6' />
              </motion.button>

              <div className='pt-6 border-t border-slate-700/50'>
                <p className='text-sm text-slate-400'>
                  © 2026 SERVEVELIO. All rights reserved.
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
