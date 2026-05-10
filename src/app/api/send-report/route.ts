import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Revenue Leak Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .metric { margin: 20px 0; padding: 10px; border-left: 4px solid #007bff; background: #f8f9fa; }
    .highlight { font-size: 1.2em; font-weight: bold; color: #dc3545; }
  </style>
</head>
<body>
  <h1>Revenue Leak Analysis Report</h1>
  <p>Thank you for using our revenue funnel calculator. Below is your personalized analysis:</p>
  
  <div class="metric">
    <strong>Monthly Leads:</strong> ${data.leadsPerMonth.toLocaleString()}
  </div>
  
  <div class="metric">
    <strong>Conversion Rate:</strong> ${(data.conversionRate * 100).toFixed(1)}%
  </div>
  
  <div class="metric">
    <strong>Average Deal Value:</strong> $${data.dealValue.toLocaleString()}
  </div>
  
  <div class="metric">
    <strong>Response Time:</strong> ${data.responseDelay.replace(/([A-Z])/g, ' $1').toLowerCase()}
  </div>
  
  <div class="metric">
    <strong>Potential Monthly Revenue:</strong> $${data.potentialRevenue.toLocaleString()}
  </div>
  
  <div class="metric">
    <strong>Captured Revenue:</strong> $${data.capturedRevenue.toLocaleString()}
  </div>
  
  <div class="metric">
    <strong class="highlight">Revenue Leak:</strong> $${data.revenueLeak.toLocaleString()}
  </div>
  
  <p>This represents the revenue you're potentially losing due to delayed responses. Contact us for strategies to improve your response times and capture more revenue.</p>
</body>
</html>
  `;
}

async function generatePDF(html: string): Promise<Buffer> {
  const apiKey = process.env.DOCRAPTOR_API_KEY;
  if (!apiKey) {
    throw new Error('DocRaptor API key not configured');
  }

  const response = await fetch('https://docraptor.com/docs', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_content: html,
      type: 'pdf',
      test: process.env.NODE_ENV !== 'production',
    }),
  });

  if (!response.ok) {
    throw new Error(`DocRaptor error: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
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
    conversion_rate: Number(body.conversionRate) || 0.1,
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

    // Send email with PDF attachment
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      to: payload.email,
      subject: 'Your Revenue Leak Analysis Report',
      html: `
        <p>Thank you for your interest in optimizing your revenue funnel!</p>
        <p>Attached is your personalized revenue leak analysis report.</p>
        <p>If you'd like to discuss strategies to reduce your revenue leak, feel free to book a consultation.</p>
        <p>Best regards,<br>The Revenue Team</p>
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
