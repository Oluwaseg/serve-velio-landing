'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  consent: z.boolean().refine((value) => value === true, {
    message: 'Please agree to receive the report and insights.',
  }),
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
      conversionRate: '' as any,
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
  const canRevealResponse =
    canRevealConversion && !Number.isNaN(conversionRateValue);

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
          consent: values.consent,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setApiMessage(
          result?.error ?? 'There was an issue saving your report.'
        );
      } else {
        setApiMessage(result?.message ?? 'Report queued for your team.');
      }
    } catch (error) {
      setApiMessage('Could not connect to the reporting API.');
    } finally {
      setIsSubmitting(false);
      setStep('analyzing');
      setTimeout(() => setStep('result'), 3200);
    }
  };

  return (
    <main className='relative isolate bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'>
      <AnimatePresence mode='wait'>
        {/* HERO SECTION */}
        {step === 'hero' && (
          <motion.section
            key='hero'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
              <div className='absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
            </div>

            <div className='relative z-10 max-w-4xl mx-auto w-full'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className='text-center space-y-6'
              >
                <div className='inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm'>
                  <Sparkles className='w-4 h-4 text-purple-400' />
                  <span className='text-xs sm:text-sm font-medium text-purple-200'>
                    Revenue Recovery for High-Growth Operators
                  </span>
                </div>

                <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight'>
                  <span className='bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent'>
                    Every Minute Your Ads Run
                  </span>
                  <br />
                  <span className='text-white'>Without a Response,</span>
                  <br />
                  <span className='bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
                    You Are Losing Money.
                  </span>
                </h1>

                <div className='space-y-3 max-w-2xl mx-auto'>
                  <p className='text-base sm:text-lg text-purple-200 font-semibold'>
                    Stop the "Lead Leak."
                  </p>
                  <p className='text-sm sm:text-base text-slate-300 leading-relaxed'>
                    We bridge the gap between your ad spend and your bank
                    account with high-speed follow-up and swift sales
                    operations.
                  </p>
                  <p className='text-xs sm:text-sm text-slate-400 leading-relaxed'>
                    You're spending thousands on Meta and LinkedIn to find
                    customers. But if a lead comments on your post or fills out
                    your form and waits 4 hours for a reply, they've already
                    moved on to your competitor.
                  </p>
                  <p className='text-base sm:text-lg text-purple-300 font-semibold'>
                    The Lead Response Gap is the #1 killer of ROI.
                  </p>
                  <p className='text-sm text-slate-300'>
                    Want to see the exact dollar amount slipping through your
                    fingers? Use the tool below.
                  </p>
                </div>

                <motion.button
                  onClick={() => setStep('calculator')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30 text-sm sm:text-base'
                >
                  Calculate My Revenue Leak
                  <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5' />
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* CALCULATOR SECTION */}
        {step === 'calculator' && (
          <motion.section
            key='calculator'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl' />
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
                  className='space-y-5'
                >
                  <div className='space-y-1'>
                    <h2 className='text-3xl sm:text-4xl font-bold'>
                      The Revenue Recovery Calculator
                    </h2>
                    <p className='text-xs sm:text-sm text-slate-400'>
                      Fill in your metrics to see your exact revenue leak
                    </p>
                  </div>

                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='block text-xs sm:text-sm font-semibold text-slate-200'>
                        Average Monthly Lead Volume
                      </label>
                      <input
                        type='number'
                        {...calculator.register('leadsPerMonth')}
                        placeholder='500'
                        className='w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm'
                      />
                      {calculator.formState.errors.leadsPerMonth && (
                        <p className='text-xs text-red-400'>
                          {calculator.formState.errors.leadsPerMonth.message}
                        </p>
                      )}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canRevealDeal ? 1 : 0.5 }}
                      className='space-y-2'
                    >
                      <label className='block text-xs sm:text-sm font-semibold text-slate-200'>
                        Average Deal Value (LTV)
                      </label>
                      <input
                        type='number'
                        {...calculator.register('dealValue')}
                        placeholder='5000'
                        disabled={!canRevealDeal}
                        className='w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                      />
                      {calculator.formState.errors.dealValue && (
                        <p className='text-xs text-red-400'>
                          {calculator.formState.errors.dealValue.message}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canRevealConversion ? 1 : 0.5 }}
                      className='space-y-2'
                    >
                      <label className='block text-xs sm:text-sm font-semibold text-slate-200'>
                        Estimated Conversion Rate (Decimal)
                      </label>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        max='1'
                        {...calculator.register('conversionRate')}
                        placeholder='0.30'
                        disabled={!canRevealConversion}
                        className='w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                      />
                      {calculator.formState.errors.conversionRate && (
                        <p className='text-xs text-red-400'>
                          {calculator.formState.errors.conversionRate.message}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canRevealResponse ? 1 : 0.5 }}
                      className='space-y-2'
                    >
                      <label className='block text-xs sm:text-sm font-semibold text-slate-200'>
                        Current Average Response Time (Estimated)
                      </label>
                      <select
                        {...calculator.register('responseDelay')}
                        disabled={!canRevealResponse}
                        className='w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                      >
                        <option value=''>Select response time</option>
                        {responseOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {calculator.formState.errors.responseDelay && (
                        <p className='text-xs text-red-400'>
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
                  className='flex flex-col justify-between'
                >
                  <div className='rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 space-y-6 flex-1'>
                    <motion.div
                      key={`leads-${leadsPerMonthValue}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className='space-y-1'
                    >
                      <p className='text-xs text-slate-400'>Monthly Leads</p>
                      <p className='text-3xl sm:text-4xl font-bold text-white'>
                        {leadsPerMonthValue || '—'}
                      </p>
                    </motion.div>

                    {canRevealDeal && (
                      <motion.div
                        key={`deal-${dealValueNumber}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className='space-y-1'
                      >
                        <p className='text-xs text-slate-400'>Deal Value</p>
                        <p className='text-3xl sm:text-4xl font-bold text-purple-300'>
                          {dealValueNumber
                            ? formatNumber(dealValueNumber)
                            : '—'}
                        </p>
                      </motion.div>
                    )}

                    {canRevealConversion && (
                      <motion.div
                        key={`conversion-${conversionRateValue}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className='space-y-1'
                      >
                        <p className='text-xs text-slate-400'>
                          Conversion Rate
                        </p>
                        <p className='text-3xl sm:text-4xl font-bold text-blue-300'>
                          {(conversionRateValue * 100).toFixed(1)}%
                        </p>
                      </motion.div>
                    )}

                    {canRevealResponse && (
                      <motion.div
                        key={`response-${responseDelayValue}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className='space-y-1'
                      >
                        <p className='text-xs text-slate-400'>Response Time</p>
                        <p className='text-3xl sm:text-4xl font-bold text-pink-300'>
                          {responseDelayValue
                            ? responseOptions.find(
                                (opt) => opt.value === responseDelayValue
                              )?.label
                            : '—'}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {canRevealResponse && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() =>
                        calculator.handleSubmit(onCalculatorSubmit)()
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className='w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base'
                    >
                      Show Me the Numbers
                    </motion.button>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* EMAIL GATE SECTION */}
        {step === 'email' && (
          <motion.section
            key='email'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl' />
            </div>

            <div className='relative z-10 w-full max-w-xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-6'
              >
                <div className='text-center space-y-2'>
                  <h2 className='text-3xl sm:text-4xl font-bold'>
                    See Your Recovery Report.
                  </h2>
                  <p className='text-xs sm:text-sm text-slate-300'>
                    Enter your email to view your results. We'll also send you a
                    PDF breakdown and our "Systems Architect" tips on plugging
                    lead leaks for good.
                  </p>
                </div>

                <motion.form
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className='space-y-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8'
                >
                  <div className='space-y-2'>
                    <label className='block text-xs sm:text-sm font-semibold text-slate-200'>
                      Enter your professional email
                    </label>
                    <input
                      type='email'
                      {...emailForm.register('email')}
                      placeholder='your@email.com'
                      className='w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm'
                    />
                    {emailForm.formState.errors.email && (
                      <p className='text-xs text-red-400'>
                        {emailForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className='flex items-start gap-2'>
                    <input
                      type='checkbox'
                      {...emailForm.register('consent')}
                      className='mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800/50 text-purple-600 focus:ring-2 focus:ring-purple-500/20 cursor-pointer'
                    />
                    <label className='text-xs sm:text-sm text-slate-300'>
                      Yes, send me my report and add me to the Revenue
                      Operations newsletter for recurring tactical growth tips.
                    </label>
                  </div>
                  {emailForm.formState.errors.consent && (
                    <p className='text-xs text-red-400'>
                      {emailForm.formState.errors.consent.message}
                    </p>
                  )}

                  <motion.button
                    type='submit'
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base'
                  >
                    {isSubmitting ? 'Processing...' : 'Show Me the Numbers'}
                  </motion.button>

                  {apiMessage && (
                    <p className='text-xs sm:text-sm text-slate-300 text-center'>
                      {apiMessage}
                    </p>
                  )}
                </motion.form>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ANALYZING SECTION */}
        {step === 'analyzing' && (
          <motion.section
            key='analyzing'
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-blue-900/30' />
            </div>

            <div className='relative z-10 w-full max-w-3xl mx-auto text-center'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-8'
              >
                <h2 className='text-3xl sm:text-4xl font-bold'>
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
                      className='rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-4 sm:p-6'
                    >
                      <p className='text-slate-300 text-xs sm:text-sm mb-3'>
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
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
              <div className='absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
            </div>

            <div className='relative z-10 w-full max-w-5xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='space-y-6'
              >
                {/* Header */}
                <div className='text-center space-y-2'>
                  <h2 className='text-3xl sm:text-4xl font-bold'>
                    Your Estimated Monthly Revenue Leak
                  </h2>
                </div>

                {/* Main Result Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className='rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 text-center space-y-4'
                >
                  <motion.p
                    key={calcResult?.revenueLeak}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className='text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
                  >
                    {calcResult ? formatNumber(calcResult.revenueLeak) : '$0'}
                  </motion.p>
                  <p className='text-slate-300 text-xs sm:text-sm max-w-xl mx-auto'>
                    This is the revenue you're losing every month due to slow
                    response times.
                  </p>
                </motion.div>

                {/* Convincer Copy */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='rounded-xl border border-slate-700 bg-slate-800/30 p-5 sm:p-6 text-center space-y-2'
                >
                  <p className='text-base sm:text-lg font-semibold text-white'>
                    This isn't just a number; it's a structural failure in your
                    sales process.
                  </p>
                  <p className='text-xs sm:text-sm text-slate-300'>
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
                      desc: 'We don\'t just "talk", we move your leads through high-conversion scripts to close the deal.',
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
                      className='rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-4 sm:p-6 space-y-2'
                    >
                      <h3 className='text-sm sm:text-base font-bold text-white'>
                        {item.title}
                      </h3>
                      <p className='text-xs sm:text-sm text-slate-300 leading-relaxed'>
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
                  className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base'
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
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2' />
            </div>

            <div className='relative z-10 w-full max-w-3xl mx-auto'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className='text-center space-y-8'
              >
                <div className='space-y-4'>
                  <h2 className='text-3xl sm:text-4xl font-bold'>
                    Ready to Turn "Ghost Revenue" into Banked Profit?
                  </h2>
                  <p className='text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed'>
                    I have cleared 15 minutes on my calendar to walk you through
                    a custom Revenue Recovery roadmap for your company. No sales
                    pitch, just a tactical blueprint to stop the leak.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className='rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm p-6 sm:p-8 space-y-6'
                >
                  <div className='space-y-2'>
                    <h3 className='text-xl sm:text-2xl font-bold text-white'>
                      Book Your 15-Minute Revenue Audit
                    </h3>
                    <p className='text-xs sm:text-sm text-slate-300'>
                      So we can dive straight into the fix.
                    </p>
                  </div>

                  <motion.a
                    href={calendlyUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30 text-sm sm:text-base'
                  >
                    Schedule Your Call
                    <ExternalLink className='w-4 h-4 sm:w-5 sm:h-5' />
                  </motion.a>
                </motion.div>

                <motion.button
                  onClick={() => setStep('footer')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='text-slate-400 hover:text-slate-300 text-xs sm:text-sm font-medium transition-colors'
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
            className='relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden'
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
                <h2 className='text-3xl sm:text-4xl font-bold'>
                  Managed Operations for High-Growth Firms.
                </h2>
                <p className='text-xs sm:text-sm text-slate-300'>
                  Your revenue recovery starts now.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className='flex flex-col sm:flex-row gap-4 justify-center items-center text-xs sm:text-sm'
              >
                <a
                  href='#'
                  className='text-purple-300 hover:text-purple-200 font-semibold transition-colors'
                >
                  View Full Portfolio
                </a>
                <span className='hidden sm:block text-slate-600'>|</span>
                <a
                  href='#'
                  className='text-purple-300 hover:text-purple-200 font-semibold transition-colors'
                >
                  LinkedIn Profile
                </a>
                <span className='hidden sm:block text-slate-600'>|</span>
                <a
                  href='#'
                  className='text-purple-300 hover:text-purple-200 font-semibold transition-colors'
                >
                  Privacy Policy
                </a>
              </motion.div>

              <motion.button
                onClick={() => {
                  setStep('hero');
                  calculator.reset();
                  emailForm.reset();
                  setCalcPayload(null);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/30 text-sm sm:text-base'
              >
                Start Over
                <ArrowRight className='w-4 h-4 sm:w-5 sm:h-5' />
              </motion.button>

              <div className='pt-6 border-t border-slate-700/50'>
                <p className='text-xs text-slate-400'>
                  © 2026 Revenue Operations. All rights reserved.
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
