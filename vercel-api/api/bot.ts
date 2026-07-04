import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../api-src/utils/supabase';
import { sha256 } from '../api-src/utils/crypto';
import {
  createLicenseAdmin,
  resetLicenseDevicesAdmin,
  removeUserAccessAdmin
} from '../api-src/utils/license-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const adminSecret = (process.env.ADMIN_SECRET || '').trim();

  if (!botToken) {
    console.error('[TG Bot] TELEGRAM_BOT_TOKEN is not configured.');
  }

  // --- 1. Webhook Setup GET Endpoint ---
  if (req.method === 'GET') {
    const secret = req.query.secret as string;
    if (!secret || secret !== adminSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Invalid secret query parameter.' });
    }

    if (!botToken) {
      return res.status(400).json({ success: false, error: 'TELEGRAM_BOT_TOKEN environment variable is not configured.' });
    }

    const host = req.headers.host || process.env.VERCEL_URL || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${protocol}://${host}/api/bot`;

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`, {
        headers: { 'Connection': 'close' }
      });
      const tgData = await tgRes.json();

      return res.status(tgRes.status).json({
        success: tgData.ok,
        message: tgData.description || 'Webhook setup command sent.',
        webhook_url: webhookUrl,
        telegram_response: tgData,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to contact Telegram API: ' + err.message });
    }
  }

  // --- 2. Webhook POST Endpoint ---
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    if (!update) {
      return res.status(200).json({ success: true, message: 'No update payload' });
    }

    console.log('[TG Bot] Incoming Update:', JSON.stringify(update));
    console.log('[TG Bot] Token loaded:', botToken ? `YES (length ${botToken.length})` : 'NO');

    // Core async handler to keep the container active until completion
    const processUpdate = async () => {

    // A. Verify sender is an authorized administrator
    const adminIdsStr = process.env.TELEGRAM_ADMIN_IDS || '';
    const adminIds = adminIdsStr.split(',').map(s => s.trim()).filter(Boolean);

    // Helpers to create keyboards
    const buildGenerateKeyboard = (plan: string, devices: number, days: number) => {
      const standardDevices = [1, 2, 5, 10];
      const isCustomDevices = !standardDevices.includes(devices);

      const standardDays = [7, 30, 365, 0];
      const isCustomDays = !standardDays.includes(days);

      return {
        inline_keyboard: [
          [
            { text: plan === 'pro' ? '⭐ 𝓟𝓻𝓸' : 'pro', callback_data: `param:pro:${devices}:${days}` },
            { text: plan === 'enterprise' ? '💎 𝓔𝓷𝓽𝓮𝓻𝓹𝓻𝓲𝓼𝓮' : 'enterprise', callback_data: `param:enterprise:${devices}:${days}` },
            { text: plan === 'free' ? '🎁 𝓕𝓻𝓮𝓮' : 'free', callback_data: `param:free:${devices}:${days}` }
          ],
          [
            { text: devices === 1 ? '✅ 1 Device' : '1 Device', callback_data: `param:${plan}:1:${days}` },
            { text: devices === 2 ? '✅ 2 Devices' : '2 Devices', callback_data: `param:${plan}:2:${days}` },
            { text: devices === 5 ? '✅ 5 Devices' : '5 Devices', callback_data: `param:${plan}:5:${days}` },
            { text: devices === 10 ? '✅ 10 Devices' : '10 Devices', callback_data: `param:${plan}:10:${days}` },
            { text: isCustomDevices ? `✅ ✏️ ${devices} Devs` : '✏️ Custom', callback_data: `ask:devices:${plan}:${devices}:${days}` }
          ],
          [
            { text: days === 7 ? '✅ 7 Days' : '7 Days', callback_data: `param:${plan}:${devices}:7` },
            { text: days === 30 ? '✅ 30 Days' : '30 Days', callback_data: `param:${plan}:${devices}:30` },
            { text: days === 365 ? '✅ 365 Days' : '365 Days', callback_data: `param:${plan}:${devices}:365` },
            { text: days === 0 ? '✅ Lifetime' : 'Lifetime', callback_data: `param:${plan}:${devices}:0` },
            { text: isCustomDays ? `✅ ✏️ ${days} Days` : '✏️ Custom', callback_data: `ask:days:${plan}:${devices}:${days}` }
          ],
          [
            { text: '⚡ 𝓖𝓔𝓝𝓔𝓡𝓐𝓣𝓔 𝓛𝓘𝓒𝓔𝓝𝓢𝓔 ⚡', callback_data: `create:${plan}:${devices}:${days}` }
          ],
          [
            { text: '⬅️ Back to Main Menu', callback_data: 'cancel' }
          ]
        ]
      };
    };

    const startKeyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Create License', callback_data: 'param:pro:1:30' }
        ],
        [
          { text: '📊 Database Stats', callback_data: 'stats' }
        ]
      ]
    };

    // Helper to send messages back to the chat (omitting reply_markup if empty to prevent error 400)
    const sendReply = async (chatId: number, replyText: string, keyboard?: any) => {
      if (!botToken) return;
      try {
        const body: any = {
          chat_id: chatId,
          text: replyText,
          parse_mode: 'HTML',
        };
        if (keyboard) {
          body.reply_markup = keyboard;
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'close'
          },
          body: JSON.stringify(body),
        });
        console.log(`[TG Bot] SendMessage API response status: ${response.status}`);
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[TG Bot] SendMessage failed (status ${response.status}):`, errText);
        }
      } catch (err) {
        console.error('[TG Bot] SendMessage exception:', err);
      }
    };

    // Helper to edit existing messages (omitting reply_markup if empty to prevent error 400)
    const editMessage = async (chatId: number, messageId: number, replyText: string, keyboard?: any) => {
      if (!botToken) return;
      try {
        const body: any = {
          chat_id: chatId,
          message_id: messageId,
          text: replyText,
          parse_mode: 'HTML',
        };
        if (keyboard) {
          body.reply_markup = keyboard;
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'close'
          },
          body: JSON.stringify(body),
        });
        console.log(`[TG Bot] EditMessage API response status: ${response.status}`);
        if (!response.ok) {
          const errText = await response.text();
          // Filter warning logs for clean stats
          if (!errText.includes('message is not modified')) {
            console.error(`[TG Bot] EditMessage failed (status ${response.status}):`, errText);
          }
        }
      } catch (err) {
        console.error('[TG Bot] EditMessage exception:', err);
      }
    };

    // Helper to answer callback queries
    const answerCallback = async (callbackQueryId: string) => {
      if (!botToken) return;
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'close'
          },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
          }),
        });
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[TG Bot] AnswerCallbackQuery failed (status ${response.status}):`, errText);
        }
      } catch (err) {
        console.error('[TG Bot] answerCallbackQuery failed:', err);
      }
    };

    // --- CASE 1: Inline Button Click Callback ---
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackQueryId = callbackQuery.id;
      const chatId = callbackQuery.message?.chat.id;
      const messageId = callbackQuery.message?.message_id;
      const data = callbackQuery.data || '';
      const senderId = String(callbackQuery.from?.id || '');

      console.log(`[TG Bot] Callback Query - Data: "${data}", Sender ID: "${senderId}", Whitelisted: ${adminIds.includes(senderId)}`);

      if (!chatId || !messageId) return;

      // Acknowledge the callback immediately
      await answerCallback(callbackQueryId);

      // Verify admin authorization
      if (!adminIds.includes(senderId)) {
        await sendReply(chatId, `🚫 <b>Access Denied</b>\nYour Telegram User ID (<code>${senderId}</code>) is not authorized.`);
        return;
      }

      // Handle Cancel / Back to Main Menu
      if (data === 'cancel') {
        await editMessage(chatId, messageId, `🤖 <b>𝓑𝔂𝓟𝓪𝓼𝓼 𝓐𝓲 𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓜𝓪𝓷𝓪𝓰𝓮𝓶𝓮𝓷𝓽 𝓑𝓸𝓽</b>\n\nClick the options below to manage licenses:`, startKeyboard);
        return;
      }

      // Handle Stats Check
      if (data === 'stats') {
        try {
          console.log('[TG Bot] Fetching stats from Supabase concurrently...');
          const [totalKeysRes, activeKeysRes, totalDevicesRes, legacyDevicesRes] = await Promise.all([
            supabase.from('licenses').select('*', { count: 'exact', head: true }),
            supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('license_devices').select('*', { count: 'exact', head: true }),
            supabase.from('devices').select('*', { count: 'exact', head: true })
          ]);

          const totalKeys = totalKeysRes.count;
          const activeKeys = activeKeysRes.count;
          const totalDevices = totalDevicesRes.count;
          const legacyDevices = legacyDevicesRes.count;

          const activeDevices = (totalDevices || 0) + (legacyDevices || 0);

          console.log(`[TG Bot] Stats retrieved. TotalKeys: ${totalKeys}, ActiveKeys: ${activeKeys}, Devices: ${activeDevices}`);
          await editMessage(chatId, messageId, `📊 <b>𝓓𝓪𝓽𝓪𝓫𝓪𝓼𝓮 𝓞𝓿𝓮𝓻𝓿𝓲𝓮𝔀 𝓢𝓽𝓪𝓽𝓲𝓼𝓽𝓲𝓬𝓼</b>\n\n• <b>Total License Keys:</b> ${totalKeys || 0}\n• <b>Active License Keys:</b> ${activeKeys || 0}\n• <b>Active Devices:</b> ${activeDevices}`, startKeyboard);
        } catch (err: any) {
          await sendReply(chatId, `❌ <b>Error retrieving stats:</b> ${err.message}`);
        }
        return;
      }

      // Handle Parameter selections (param:plan:devices:days)
      if (data.startsWith('param:')) {
        const parts = data.split(':');
        const plan = parts[1] || 'pro';
        const devices = parseInt(parts[2] || '1', 10);
        const days = parseInt(parts[3] || '30', 10);

        const promptText = `🆕 <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓚𝓮𝔂 𝓒𝓸𝓷𝓯𝓲𝓰𝓾𝓻𝓪𝓽𝓲𝓸𝓷 𝓟𝓪𝓷𝓮𝓵</b>\n\nSelect the parameters for the new license below:\n\n• Selected Plan: <b>${plan.toUpperCase()}</b>\n• Selected Device Limit: <b>${devices} Device(s)</b>\n• Selected Period: <b>${days === 0 ? 'Lifetime' : `${days} Days`}</b>`;
        await editMessage(chatId, messageId, promptText, buildGenerateKeyboard(plan, devices, days));
        return;
      }

      // Handle Ask Custom Devices (ask:devices:plan:devices:days)
      if (data.startsWith('ask:devices:')) {
        const parts = data.split(':');
        const plan = parts[2] || 'pro';
        const days = parseInt(parts[4] || '30', 10);

        await sendReply(chatId, `✏️ <b>Enter custom device limit</b> (1-1000) for setup:\n<code>(setup: plan: ${plan}, days: ${days})</code>\n\n<i>Reply to this message with the number of devices.</i>`, { force_reply: true, selective: true });
        return;
      }

      // Handle Ask Custom Expiry (ask:days:plan:devices:days)
      if (data.startsWith('ask:days:')) {
        const parts = data.split(':');
        const plan = parts[2] || 'pro';
        const devices = parseInt(parts[3] || '1', 10);

        await sendReply(chatId, `✏️ <b>Enter custom expiry days</b> (0 for Lifetime) for setup:\n<code>(setup: plan: ${plan}, devices: ${devices})</code>\n\n<i>Reply to this message with the number of days.</i>`, { force_reply: true, selective: true });
        return;
      }

      // Handle Confirm and Create (create:plan:devices:days)
      if (data.startsWith('create:')) {
        const parts = data.split(':');
        const plan = parts[1] || 'pro';
        const devices = parseInt(parts[2] || '1', 10);
        const days = parseInt(parts[3] || '30', 10);

        console.log(`[TG Bot] License creation requested: plan=${plan}, devices=${devices}, days=${days}`);

        let expiresAt: string | null = null;
        if (days > 0) {
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const customerName = `Bot Generated - ${dateStr}`;

        try {
          // --- Fast Loading State ---
          console.log('[TG Bot] Sending loading state (Generating)...');
          await editMessage(chatId, messageId, `⏳ <b>𝓒𝓸𝓷𝓷𝓮𝓬𝓽𝓲𝓷𝓰 𝓪𝓷𝓭 𝓖𝓮𝓷𝓮𝓻𝓪𝓽𝓲𝓷𝓰 𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓚𝓮𝔂...</b>\n<code>[■■■■■□□□□□] 50%</code>`);

          console.log('[TG Bot] Executing createLicenseAdmin database insert...');
          const result = await createLicenseAdmin({
            customer_name: customerName,
            plan: plan,
            max_devices: devices,
            expires_at: expiresAt,
          });

          console.log('[TG Bot] createLicenseAdmin execution completed. Success:', result.success);

          if (!result.success || !result.license_key) {
            console.error('[TG Bot] createLicenseAdmin failed:', result.message);
            await editMessage(chatId, messageId, `❌ <b>Failed to create license:</b> ${result.message || 'Unknown error'}`, startKeyboard);
            return;
          }

          console.log('[TG Bot] License key successfully generated:', result.license_key.substring(0, 8) + '...');
          const responseText = `✅ <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓒𝓻𝓮𝓪𝓽𝓮𝓭 𝓢𝓾𝓬𝓬𝓮𝓼𝓼𝓯𝓾𝓵𝓵𝔂!</b>\n\n🔑 <b>License Key:</b> <code>${result.license_key}</code>\n👤 <b>Customer:</b> ${customerName}\n📦 <b>Plan:</b> ${plan.toUpperCase()}\n💻 <b>Max Devices:</b> ${devices}\n📅 <b>Expiry:</b> ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never (Lifetime)'}\n\n<i>Please copy the key now — it cannot be shown again.</i>`;
          await editMessage(chatId, messageId, responseText, startKeyboard);
        } catch (err: any) {
          console.error('[TG Bot] Exception in license generation block:', err.message, err.stack);
          await editMessage(chatId, messageId, `❌ <b>Error creating license:</b> ${err.message}`, startKeyboard);
        }
        return;
      }
      return;
    }

    // --- CASE 2: Text Commands & Replies ---
    const message = update.message;
    if (!message) return;

    const chatId = message.chat?.id;
    const text = (message.text || '').trim();
    const senderId = String(message.from?.id || '');

    console.log(`[TG Bot] Text Message - Text: "${text}", Sender ID: "${senderId}", Whitelisted: ${adminIds.includes(senderId)}`);

    if (!chatId || !text) return;

    // Verify admin authorization
    if (!adminIds.includes(senderId)) {
      await sendReply(chatId, `🚫 <b>Access Denied</b>\nYour Telegram User ID (<code>${senderId}</code>) is not authorized to use this license bot.\n\n<i>To grant access, add this ID to the <code>TELEGRAM_ADMIN_IDS</code> environment variable.</i>`);
      return;
    }

    // Handle force reply responses from custom device/day questions
    if (message.reply_to_message) {
      const replyToText = message.reply_to_message.text || '';

      // A. Custom Devices reply parsing
      if (replyToText.includes('Enter custom device limit')) {
        const match = replyToText.match(/setup:\s*\(setup:\s*plan:\s*([a-z]+),\s*days:\s*(\d+)\)/i);
        if (match) {
          const plan = match[1];
          const days = parseInt(match[2], 10);
          const devices = parseInt(text, 10);

          if (isNaN(devices) || devices < 1 || devices > 1000) {
            await sendReply(chatId, `❌ <b>Invalid Input</b>\nPlease reply with a valid number of devices between 1 and 1000.`);
          } else {
            const promptText = `🆕 <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓚𝓮𝔂 𝓒𝓸𝓷𝓯𝓲𝓰𝓾𝓻𝓪𝓽𝓲𝓸𝓷 𝓟𝓪𝓷𝓮𝓵</b>\n\nSelect the parameters for the new license below:\n\n• Selected Plan: <b>${plan.toUpperCase()}</b>\n• Selected Device Limit: <b>${devices} Device(s)</b>\n• Selected Period: <b>${days === 0 ? 'Lifetime' : `${days} Days`}</b>`;
            await sendReply(chatId, promptText, buildGenerateKeyboard(plan, devices, days));
          }
          return;
        }
      }

      // B. Custom Expiry Days reply parsing
      if (replyToText.includes('Enter custom expiry days')) {
        const match = replyToText.match(/setup:\s*\(setup:\s*plan:\s*([a-z]+),\s*devices:\s*(\d+)\)/i);
        if (match) {
          const plan = match[1];
          const devices = parseInt(match[2], 10);
          const days = parseInt(text, 10);

          if (isNaN(days) || days < 0 || days > 36500) {
            await sendReply(chatId, `❌ <b>Invalid Input</b>\nPlease reply with a valid number of expiry days (0 or greater).`);
          } else {
            const promptText = `🆕 <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓚𝓮𝔂 𝓒𝓸𝓷𝓯𝓲𝓰𝓾𝓻𝓪𝓽𝓲𝓸𝓷 𝓟𝓪𝓷𝓮𝓵</b>\n\nSelect the parameters for the new license below:\n\n• Selected Plan: <b>${plan.toUpperCase()}</b>\n• Selected Device Limit: <b>${devices} Device(s)</b>\n• Selected Period: <b>${days === 0 ? 'Lifetime' : `${days} Days`}</b>`;
            await sendReply(chatId, promptText, buildGenerateKeyboard(plan, devices, days));
          }
          return;
        }
      }
    }

    // Process Start/Help
    if (text.startsWith('/start') || text.startsWith('/help')) {
      await sendReply(chatId, `🤖 <b>𝓑𝔂𝓟𝓪𝓼𝓼 𝓐𝓲 𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓜𝓪𝓷𝓪𝓰𝓮𝓶𝓮𝓷𝓽 𝓑𝓸𝓽</b>\n\nClick the options below to manage licenses, or run manual commands:`, startKeyboard);
      return;
    }

    // Manual /generate Command (Legacy fallback support)
    if (text.startsWith('/generate')) {
      const match = text.match(/\/generate\s+(?:"([^"]+)"|([^\s]+))(?:\s+([^\s]+))?(?:\s+(\d+))?(?:\s+(\d+))?/);
      if (!match) {
        await sendReply(chatId, `❌ <b>Syntax Error</b>\nUsage: <code>/generate "Customer Name" [plan] [max_devices] [expires_in_days]</code>\n\nExample: <code>/generate "John Doe" pro 2 30</code>`);
        return;
      }

      const customerName = match[1] || match[2];
      const plan = match[3] || 'pro';
      const maxDevices = match[4] ? parseInt(match[4], 10) : 1;
      const days = match[5] ? parseInt(match[5], 10) : null;

      let expiresAt: string | null = null;
      if (days) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      try {
        const result = await createLicenseAdmin({
          customer_name: customerName,
          plan: plan,
          max_devices: maxDevices,
          expires_at: expiresAt,
        });

        if (!result.success || !result.license_key) {
          await sendReply(chatId, `❌ <b>Failed to create license:</b> ${result.message || 'Unknown error'}`);
          return;
        }

        await sendReply(chatId, `✅ <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓒𝓻𝓮𝓪𝓽𝓮𝓭 𝓢𝓾𝓬𝓬𝓮𝓼𝓼𝓯𝓾𝓵𝓵𝔂!</b>\n\n🔑 <b>License Key:</b> <code>${result.license_key}</code>\n👤 <b>Customer:</b> ${customerName}\n📦 <b>Plan:</b> ${plan}\n💻 <b>Max Devices:</b> ${maxDevices}\n📅 <b>Expiry:</b> ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Never (Lifetime)'}\n\n<i>Please copy the key now — it cannot be retrieved again.</i>`);
      } catch (err: any) {
        await sendReply(chatId, `❌ <b>Error creating license:</b> ${err.message}`);
      }
      return;
    }

    // Manual /status [key]
    if (text.startsWith('/status')) {
      const parts = text.split(/\s+/);
      const licenseKey = parts[1];

      if (!licenseKey) {
        await sendReply(chatId, `❌ <b>Syntax Error</b>\nUsage: <code>/status [license_key]</code>`);
        return;
      }

      try {
        const hashedKey = sha256(licenseKey.trim());
        const { data: license, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key_hash', hashedKey)
          .maybeSingle();

        if (error || !license) {
          await sendReply(chatId, `❌ <b>License not found.</b> Verify the key is correct.`);
          return;
        }

        // Count devices
        const { count: countNew } = await supabase
          .from('license_devices')
          .select('*', { count: 'exact', head: true })
          .eq('license_id', license.id);

        const { count: countLegacy } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('license_id', license.id);

        const activeCount = (countNew || 0) + (countLegacy || 0);

        await sendReply(chatId, `🔑 <b>𝓛𝓲𝓬𝓮𝓷𝓼𝓮 𝓚𝓮𝔂 𝓢𝓽𝓪𝓽𝓾𝓼</b>\n\n🔑 <b>Key (Hash):</b> <code>${license.license_key_hash.substring(0, 10)}...</code>\n👤 <b>Customer:</b> ${license.customer_name || 'Unknown'}\n📦 <b>Plan:</b> ${license.plan || license.plan_name || 'pro'}\n🟢 <b>Status:</b> <code>${license.status}</code>\n💻 <b>Devices:</b> ${activeCount} / ${license.max_devices} active\n📅 <b>Expiry:</b> ${license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never (Lifetime)'}\n⏰ <b>Created:</b> ${new Date(license.created_at).toLocaleDateString()}`);
      } catch (err: any) {
        await sendReply(chatId, `❌ <b>Error checking status:</b> ${err.message}`);
      }
      return;
    }

    // Manual /reset [key]
    if (text.startsWith('/reset')) {
      const parts = text.split(/\s+/);
      const licenseKey = parts[1];

      if (!licenseKey) {
        await sendReply(chatId, `❌ <b>Syntax Error</b>\nUsage: <code>/reset [license_key]</code>`);
        return;
      }

      try {
        const hashedKey = sha256(licenseKey.trim());
        const { data: license, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key_hash', hashedKey)
          .maybeSingle();

        if (error || !license) {
          await sendReply(chatId, `❌ <b>License not found.</b>`);
          return;
        }

        const result = await resetLicenseDevicesAdmin(license.id);
        if (!result.success) {
          await sendReply(chatId, `❌ <b>Failed to reset devices:</b> ${result.message || 'Unknown'}`);
          return;
        }

        await sendReply(chatId, `🔄 <b>Device registrations reset!</b>\n\nAll registered devices for customer <b>${license.customer_name || 'User'}</b> have been cleared. They can now re-activate the extension on new devices.`);
      } catch (err: any) {
        await sendReply(chatId, `❌ <b>Error resetting devices:</b> ${err.message}`);
      }
      return;
    }

    // Manual /deactivate [key]
    if (text.startsWith('/deactivate')) {
      const parts = text.split(/\s+/);
      const licenseKey = parts[1];

      if (!licenseKey) {
        await sendReply(chatId, `❌ <b>Syntax Error</b>\nUsage: <code>/deactivate [license_key]</code>`);
        return;
      }

      try {
        const hashedKey = sha256(licenseKey.trim());
        const { data: license, error } = await supabase
          .from('licenses')
          .select('*')
          .eq('license_key_hash', hashedKey)
          .maybeSingle();

        if (error || !license) {
          await sendReply(chatId, `❌ <b>License not found.</b>`);
          return;
        }

        const result = await removeUserAccessAdmin(license.id);
        if (!result.success) {
          await sendReply(chatId, `❌ <b>Failed to deactivate license:</b> ${result.message || 'Unknown'}`);
          return;
        }

        await sendReply(chatId, `🚫 <b>License deactivated!</b>\n\nThe license key for customer <b>${license.customer_name || 'User'}</b> has been revoked and all device associations have been cleared.`);
      } catch (err: any) {
        await sendReply(chatId, `❌ <b>Error deactivating license:</b> ${err.message}`);
      }
      return;
    }

    // Manual /stats
    if (text.startsWith('/stats')) {
      try {
        console.log('[TG Bot] Fetching stats from Supabase concurrently (command)...');
        const [totalKeysRes, activeKeysRes, totalDevicesRes, legacyDevicesRes] = await Promise.all([
          supabase.from('licenses').select('*', { count: 'exact', head: true }),
          supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('license_devices').select('*', { count: 'exact', head: true }),
          supabase.from('devices').select('*', { count: 'exact', head: true })
        ]);

        const totalKeys = totalKeysRes.count;
        const activeKeys = activeKeysRes.count;
        const totalDevices = totalDevicesRes.count;
        const legacyDevices = legacyDevicesRes.count;

        const activeDevices = (totalDevices || 0) + (legacyDevices || 0);

        await sendReply(chatId, `📊 <b>𝓓𝓪𝓽𝓪𝓫𝓪𝓼𝓮 𝓞𝓿𝓮𝓻𝓿𝓲𝓮𝔀 𝓢𝓽𝓪𝓽𝓲𝓼𝓽𝓲𝓬𝓼</b>\n\n• <b>Total License Keys:</b> ${totalKeys || 0}\n• <b>Active License Keys:</b> ${activeKeys || 0}\n• <b>Active Devices:</b> ${activeDevices}`);
      } catch (err: any) {
        await sendReply(chatId, `❌ <b>Error retrieving stats:</b> ${err.message}`);
      }
      return;
    }

    // Command not matched
    await sendReply(chatId, `❓ <b>Unknown Command</b>\nType /help to see all available commands.`);
    };

    await processUpdate();

    console.log('[TG Bot] Update successfully processed. Responding 200 OK.');
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[TG Bot Update handler error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
