const Anthropic = require('@anthropic-ai/sdk');
const puppeteer = require('puppeteer');
const readline = require('readline');
const fs = require('fs');

// ⚙️ PASTE YOUR CLAUDE API KEY HERE
const API_KEY = 'REDACTED';

const client = new Anthropic({ apiKey: API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

// ── GENERATE CODE WITH AI ─────────────────────────────
async function generateCode(task) {
  console.log('\n🤖 AI is writing your automation code...\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a Puppeteer automation expert.
Write a complete Node.js Puppeteer script for this task: "${task}"

STRICT RULES:
- Use require('puppeteer') only
- Use async/await with (async () => { ... })();
- headless: false so user sees browser
- Add slowMo: 40 for visibility
- Add console.log for each step
- Take a screenshot at the end: page.screenshot({ path: 'result.png' })
- Add try/catch with browser.close() in finally
- Return ONLY the raw JavaScript code
- NO markdown, NO backticks, NO explanation`
    }]
  });

  return response.content[0].text.trim();
}

// ── RUN GENERATED CODE ────────────────────────────────
async function runCode(code) {
  // Save to temp file
  fs.writeFileSync('_temp_automation.js', code);
  console.log('✅ Code saved to _temp_automation.js\n');

  // Dynamically run it
  const { execSync } = require('child_process');
  try {
    execSync('node _temp_automation.js', { stdio: 'inherit' });
    console.log('\n✅ Automation completed successfully!');
  } catch (e) {
    console.log('\n❌ Error running automation:', e.message);
  }
}

// ── MAIN LOOP ─────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🤖 AI Chrome Automation              ║');
  console.log('║   Powered by Claude + Puppeteer        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Type a task and Chrome will do it for you!');
  console.log('Type "exit" to quit.\n');

  while (true) {
    const task = await ask('📝 What should Chrome do? → ');

    if (task.toLowerCase() === 'exit') {
      console.log('\n👋 Bye!\n');
      rl.close();
      break;
    }

    if (!task.trim()) continue;

    try {
      // Generate code
      const code = await generateCode(task);

      console.log('─────────────────────────────────────────');
      console.log('📄 GENERATED CODE:');
      console.log('─────────────────────────────────────────');
      console.log(code);
      console.log('─────────────────────────────────────────\n');

      // Ask before running
      const confirm = await ask('▶  Run this automation? (y/n) → ');

      if (confirm.toLowerCase() === 'y') {
        console.log('\n🚀 Launching Chrome...\n');
        await runCode(code);

        // Check for screenshot
        if (fs.existsSync('result.png')) {
          console.log('📸 Screenshot saved as result.png');
          const open = await ask('\nOpen screenshot? (y/n) → ');
          if (open.toLowerCase() === 'y') {
            require('child_process').execSync('start result.png');
          }
        }
      } else {
        console.log('⏭  Skipped.\n');
      }

    } catch (e) {
      console.log('❌ Error:', e.message);
    }

    console.log('\n─────────────────────────────────────────\n');
  }
}

main();