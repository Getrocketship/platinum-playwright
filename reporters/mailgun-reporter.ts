// reporters/mailgun-reporter.ts
import type { Reporter, TestCase, TestResult, FullConfig } from '@playwright/test/reporter';

type Failure = { title: string; project: string; file: string; error: string };

export default class MailgunReporter implements Reporter {
  private failures: Failure[] = [];
  private startedAt: Date = new Date();

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      const err = result.error;
      this.failures.push({
        title: test.titlePath().join(' › '),
        project: test.parent?.project()?.name || 'default',
        file: test.location.file,
        error: err ? (err.message || err.stack || String(err)) : 'Unknown error',
      });
    }
  }

  async onEnd() {
    if (this.failures.length === 0) return;

    const domain = process.env.MAILGUN_DOMAIN!;
    const apiKey = process.env.MAILGUN_API_KEY!;
    const to = process.env.MAILGUN_TO!;
    const from = process.env.MAILGUN_FROM || `Playwright <postmaster@${domain}>`;
    const reportUrl = process.env.REPORT_URL || 'http://localhost:9323'; // change for CI
    const runDurationSec = Math.round((Date.now() - this.startedAt.getTime()) / 1000);

    const subject = `❌ Playwright: ${this.failures.length} test(s) failed`;
    const lines = this.failures.map(
      f => `• ${f.title}\n  ↳ ${f.project} — ${f.file}\n  ↳ ${f.error.split('\n')[0]}`
    );
    const text = [
      `${this.failures.length} failure(s) in ${runDurationSec}s`,
      '',
      ...lines,
      '',
      `Report: ${reportUrl}`,
    ].join('\n');

    const html = `
      <h2>❌ Playwright: ${this.failures.length} test(s) failed</h2>
      <p><b>Duration:</b> ${runDurationSec}s</p>
      <ul>
        ${this.failures
          .map(
            f => `<li><b>${escapeHtml(f.title)}</b><br/>
                    <i>${escapeHtml(f.project)}</i> — ${escapeHtml(f.file)}<br/>
                    <code>${escapeHtml(f.error.split('\n')[0])}</code>
                  </li>`
          )
          .join('')}
      </ul>
      <p><a href="${escapeHtml(reportUrl)}">Open Playwright report</a></p>
    `;

    // Mailgun API: https://api.mailgun.net/v3/YOUR_DOMAIN/messages
    const endpoint = `https://api.mailgun.net/v3/${domain}/messages`;
    const body = new URLSearchParams({
      from,
      to,
      subject,
      text,
      html,
    });

    // Basic auth: username "api", password is your key
    const auth = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[MailgunReporter] Failed to send email:', res.status, errText);
    }
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
