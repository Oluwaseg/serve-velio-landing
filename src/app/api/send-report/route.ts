import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import type { LaunchOptions } from 'playwright-core';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const decayMultipliers: Record<string, number> = {
  under5min: 1.0,
  '5to30min': 0.4,
  '30minTo4h': 0.15,
  '4to24h': 0.05,
  over24h: 0.02,
};

function generateReportHTML(data: {
  leadsPerMonth: number;
  conversionRate: number;
  dealValue: number;
  responseDelay: string;
  revenueLeak: number;
  potentialRevenue: number;
  capturedRevenue: number;
}) {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revenue Leak Analysis Report</title>
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <!--<![endif]-->
    <style type="text/css">
        /* Client-specific Styles */
        #outlook a { padding: 0; }
        body { 
            width: 100% !important; 
            -webkit-text-size-adjust: 100%; 
            -ms-text-size-adjust: 100%; 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            background-color: #f4f7f9; 
            color: #1a202c; 
        }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        img { outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border: none; }
        table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        
        /* Layout Styles */
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 60px; padding-top: 60px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
        
        /* Content Styles */
        .header { background-color: #ffffff; padding: 48px 40px 24px 40px; text-align: center; }
        .header h1 { 
            margin: 0; 
            color: #111827; 
            font-size: 28px; 
            font-weight: 800; 
            letter-spacing: -0.025em; 
            line-height: 1.2;
        }
        
        .content { padding: 0 40px 40px 40px; }
        .intro-text { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px; text-align: center; }
        
        /* Metric Grid */
        .metric-card { 
            background-color: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 10px; 
            padding: 20px; 
            transition: all 0.2s ease;
        }
        .metric-label { 
            font-size: 12px; 
            font-weight: 600; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 8px; 
        }
        .metric-value { 
            font-size: 22px; 
            font-weight: 700; 
            color: #111827; 
        }
        
        /* Revenue Section */
        .revenue-box { 
            background-color: #f9fafb; 
            border-radius: 12px; 
            padding: 24px; 
            margin-top: 32px; 
            border: 1px solid #f3f4f6;
        }
        .revenue-row { width: 100%; }
        .revenue-label { font-size: 14px; font-weight: 500; color: #4b5563; padding: 10px 0; }
        .revenue-val { font-size: 16px; font-weight: 700; color: #111827; text-align: right; padding: 10px 0; }
        
        /* Highlight Box */
        .leak-highlight { 
            background-color: #fef2f2; 
            border: 2px solid #fee2e2; 
            border-radius: 12px; 
            padding: 32px; 
            text-align: center; 
            margin-top: 32px; 
        }
        .leak-label { 
            font-size: 13px; 
            font-weight: 700; 
            color: #dc2626; 
            text-transform: uppercase; 
            letter-spacing: 0.1em;
            margin-bottom: 8px; 
        }
        .leak-value { 
            font-size: 42px; 
            font-weight: 800; 
            color: #991b1b; 
            letter-spacing: -0.025em;
        }
        
        /* CTA Button */
        .cta-container { padding: 48px 40px; text-align: center; background-color: #ffffff; border-top: 1px solid #f3f4f6; }
        .button { 
            background-color: #2563eb; 
            border-radius: 8px; 
            color: #ffffff !important; 
            display: inline-block; 
            font-size: 16px; 
            font-weight: 600; 
            line-height: 56px; 
            text-align: center; 
            text-decoration: none; 
            width: 280px; 
            -webkit-text-size-adjust: none; 
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }
        
        /* Footer */
        .footer { padding: 40px; text-align: center; font-size: 13px; color: #9ca3af; line-height: 1.5; }

        /* Responsive adjustments */
        @media screen and (max-width: 600px) {
            .two-column { display: block !important; width: 100% !important; }
            .column { display: block !important; width: 100% !important; padding: 8px 0 !important; }
            .content { padding: 0 24px 32px 24px !important; }
            .header { padding: 40px 24px 20px 24px !important; }
            .main { border-radius: 0 !important; box-shadow: none !important; }
            .leak-value { font-size: 36px !important; }
            .wrapper { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main" width="100%" cellpadding="0" cellspacing="0">
            <!-- Header -->
            <tr>
                <td class="header">
                    <h1>Revenue Leak Analysis</h1>
                    <p style="color: #6b7280; font-size: 15px; margin-top: 8px; font-weight: 500;">Tailored Performance Report</p>
                </td>
            </tr>

            <!-- Content -->
            <tr>
                <td class="content">
                    <p class="intro-text">
                        We've completed our analysis of your sales funnel. Based on your current response times and conversion data, here is your potential revenue impact.
                    </p>

                    <!-- Metrics Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td class="two-column" style="font-size: 0; text-align: center;">
                                <!--[if (gte mso 9)|(IE)]>
                                <table width="100%" style="border-spacing: 0;">
                                <tr>
                                <td width="50%" valign="top" style="padding: 8px;">
                                <![endif]-->
                                <div class="column" style="width: 100%; max-width: 252px; display: inline-block; vertical-align: top; text-align: left; padding: 8px;">
                                    <div class="metric-card">
                                        <div class="metric-label">Monthly Leads</div>
                                        <div class="metric-value">${data.leadsPerMonth.toLocaleString()}</div>
                                    </div>
                                </div>
                                <!--[if (gte mso 9)|(IE)]>
                                </td><td width="50%" valign="top" style="padding: 8px;">
                                <![endif]-->
                                <div class="column" style="width: 100%; max-width: 252px; display: inline-block; vertical-align: top; text-align: left; padding: 8px;">
                                    <div class="metric-card">
                                        <div class="metric-label">Conversion Rate</div>
                                        <div class="metric-value">${(data.conversionRate * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <!--[if (gte mso 9)|(IE)]>
                                </td>
                                </tr>
                                </table>
                                <![endif]-->
                            </td>
                        </tr>
                        <tr>
                            <td class="two-column" style="font-size: 0; text-align: center;">
                                <!--[if (gte mso 9)|(IE)]>
                                <table width="100%" style="border-spacing: 0;">
                                <tr>
                                <td width="50%" valign="top" style="padding: 8px;">
                                <![endif]-->
                                <div class="column" style="width: 100%; max-width: 252px; display: inline-block; vertical-align: top; text-align: left; padding: 8px;">
                                    <div class="metric-card">
                                        <div class="metric-label">Avg Deal Value</div>
                                        <div class="metric-value">$${data.dealValue.toLocaleString()}</div>
                                    </div>
                                </div>
                                <!--[if (gte mso 9)|(IE)]>
                                </td><td width="50%" valign="top" style="padding: 8px;">
                                <![endif]-->
                                <div class="column" style="width: 100%; max-width: 252px; display: inline-block; vertical-align: top; text-align: left; padding: 8px;">
                                    <div class="metric-card">
                                        <div class="metric-label">Response Time</div>
                                        <div class="metric-value" style="font-size: 16px;">${data.responseDelay.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
                                    </div>
                                </div>
                                <!--[if (gte mso 9)|(IE)]>
                                </td>
                                </tr>
                                </table>
                                <![endif]-->
                            </td>
                        </tr>
                    </table>

                    <!-- Revenue Details -->
                    <div class="revenue-box">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td class="revenue-label">Potential Monthly Revenue</td>
                                <td class="revenue-val">$${data.potentialRevenue.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td class="revenue-label" style="border-top: 1px solid #e5e7eb; padding-top: 12px;">Captured Revenue</td>
                                <td class="revenue-val" style="border-top: 1px solid #e5e7eb; padding-top: 12px;">$${data.capturedRevenue.toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Highlight Leak -->
                    <div class="leak-highlight">
                        <div class="leak-label">Estimated Monthly Leak</div>
                        <div class="leak-value">$${data.revenueLeak.toLocaleString()}</div>
                    </div>

                    <p style="margin-top: 32px; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.6;">
                        This leak represents untapped revenue directly tied to response delays. By optimizing your engagement speed, you can recapture this value immediately.
                    </p>
                </td>
            </tr>

            <!-- CTA -->
            <tr>
                <td class="cta-container">
                    <p style="margin-bottom: 24px; font-weight: 700; color: #111827; font-size: 18px; letter-spacing: -0.01em;">Ready to plug the leak?</p>
                    <a href="https://calendly.com/servevelio-agency/30min" class="button">Book a Strategy Session</a>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td class="footer">
                    &copy; 2024 Servevelio Agency. All rights reserved.<br/>
                    <span style="font-size: 11px; margin-top: 8px; display: block;">This is an automated analysis based on your provided metrics.</span>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>

  `;
}

async function generatePDF(html: string): Promise<Buffer> {
  // Render HTML to PDF using Playwright + Sparticuz Chromium.
  const playwright = await import('playwright-core');
  const { chromium } = playwright;

  const chromiumPkg = await import('@sparticuz/chromium');
  // Resolve executable path from the Sparticuz package (multiple export shapes possible).
  let execPath: string | undefined;
  const pkgRecord = chromiumPkg as unknown as Record<string, unknown>;
  const candidate =
    pkgRecord['executablePath'] ??
    pkgRecord['executablePathSync'] ??
    pkgRecord['default'] ??
    pkgRecord;
  if (typeof candidate === 'function') {
    // Call or instantiate the candidate to obtain a path or helper object.
    let result: unknown;
    try {
      result = (candidate as (...args: unknown[]) => unknown)();
    } catch (err) {
      // If it's a class constructor, instantiate with `new`.
      const fnStr = String(candidate);
      if (/^class\s/.test(fnStr)) {
        const Constructor = candidate as unknown as new (
          ...args: unknown[]
        ) => unknown;
        result = new Constructor();
      } else {
        throw err;
      }
    }

    if (result instanceof Promise) result = await result;

    // Normalize possible return shapes to a string path.
    if (typeof result === 'string') {
      execPath = result;
    } else if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      if (typeof r.executablePath === 'function') {
        const p = (r.executablePath as (...a: unknown[]) => unknown)();
        execPath = p instanceof Promise ? String(await p) : String(p);
      } else if (typeof r.executablePathSync === 'function') {
        execPath = String((r.executablePathSync as () => unknown)());
      } else if (typeof r.path === 'string') {
        execPath = r.path;
      }
    }
  } else if (typeof candidate === 'string') {
    execPath = candidate;
  }

  const launchOptions: LaunchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (execPath) launchOptions.executablePath = execPath;

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdf);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const payload = {
    email: String(body.email || '').trim(),
    leads_per_month: Number(body.leadsPerMonth) || 0,
    conversion_rate: Number(body.conversionRate) || 0.3,
    deal_value: Number(body.dealValue) || 0,
    response_delay: String(body.responseDelay || ''),
    consent: Boolean(body.consent),
    created_at: new Date().toISOString(),
  };

  if (!payload.email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Calculate revenue metrics
  const D = decayMultipliers[payload.response_delay] || 0;
  const potentialRevenue =
    payload.leads_per_month * payload.conversion_rate * payload.deal_value;
  const capturedRevenue = potentialRevenue * D;
  const revenueLeak = potentialRevenue - capturedRevenue;

  // Save to database
  if (supabase) {
    const { error } = await supabase.from('leads').insert([payload]);
    if (error) {
      console.error('Supabase error:', error);
      // Continue with email sending even if DB fails
    }
  }

  try {
    // Generate PDF
    const reportData = {
      leadsPerMonth: payload.leads_per_month,
      conversionRate: payload.conversion_rate,
      dealValue: payload.deal_value,
      responseDelay: payload.response_delay,
      revenueLeak,
      potentialRevenue,
      capturedRevenue,
    };

    const html = generateReportHTML(reportData);
    const pdfBuffer = await generatePDF(html);

    const replyTo = process.env.MAIL_REPLY_TO || 'servevelio.agency@gmail.com';
    const internalCopy = process.env.MAIL_INTERNAL_COPY?.trim();

    // Send email with PDF attachment
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@servelhub.com',
      to: payload.email,
      replyTo: replyTo,
      bcc: internalCopy ? [internalCopy] : undefined,
      subject: 'Your Revenue Leak Analysis Report',
      html: `
      <p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 24px;">
  <strong>Your Revenue Recovery Report is ready.</strong>
</p>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 20px;">
  Based on the data provided, your current lead response process is likely causing significant monthly revenue leakage. We have <strong>attached your personalized analysis breakdown</strong> to this email so you can review the exact impact on your pipeline and conversion flow.
</p>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 20px;">
  This report isn't just a projection it's a tactical map showing exactly where capital is exiting your funnel due to response delays and missed opportunities.
</p>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 20px;">
  To help you plug these leaks immediately, we invite you to a focused <strong>Revenue Audit Session</strong>. During this session, we will:
</p>

<ul style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 24px; padding-left: 20px;">
  <li style="margin-bottom: 12px;">Deconstruct your specific leakage points identified in the attachment.</li>
  <li style="margin-bottom: 12px;">Deploy tactical strategies to optimize your lead handling speed.</li>
  <li style="margin-bottom: 12px;">Review the exact ROI of recapturing your "lost" revenue opportunities.</li>
</ul>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 32px;">
  Reclaiming this revenue starts with a single tactical adjustment. Secure your session below:
</p>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a202c; margin-bottom: 24px;">
  <a 
    href="https://calendly.com/servevelio-agency/30min"
    style="display:inline-block;padding:14px 28px;background:#4F46E5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2 );"
  >
    Book Your Revenue Audit
  </a>
</p>

<p style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 40px;">
  Regards,  

  <strong>The Revenue Operations Team</strong>  

  Servevelio Agency
</p>

      `,
      attachments: [
        {
          filename: 'revenue-leak-report.pdf',
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      message: 'Report sent successfully to your email.',
    });
  } catch (error) {
    console.error('Error generating/sending report:', error);
    return NextResponse.json(
      { error: 'Failed to generate or send report.' },
      { status: 500 }
    );
  }
}
