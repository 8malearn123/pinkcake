import { describe, it, expect, vi } from 'vitest';
import { unifonic, msegat, twilio, sendViaProvider, sendOrThrow } from '../providers';
import type { OutboundMessage, ProviderConfig } from '../types';

const sms: OutboundMessage = { to: '+966512345678', body: 'مرحباً', channel: 'sms' };
const wa: OutboundMessage = { ...sms, channel: 'whatsapp' };

describe('request builders', () => {
  it('unifonic posts form-encoded with AppSid + bare recipient', () => {
    const cfg: ProviderConfig = { apiKey: 'APP', senderId: 'PinkCake' };
    const req = unifonic.buildRequest(sms, cfg);
    expect(req.url).toContain('unifonic.com');
    expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(req.body).toContain('AppSid=APP');
    expect(req.body).toContain('Recipient=966512345678'); // no leading +
    expect(req.body).toContain('SenderID=PinkCake');
  });

  it('msegat posts JSON with apiKey + numbers', () => {
    const req = msegat.buildRequest(sms, { apiKey: 'K', username: 'u', senderId: 'S' });
    const json = JSON.parse(req.body);
    expect(json).toMatchObject({ apiKey: 'K', userName: 'u', userSender: 'S', numbers: '966512345678' });
  });

  it('twilio uses Basic auth and prefixes whatsapp: addresses', () => {
    const cfg: ProviderConfig = { accountSid: 'AC1', authToken: 'tok', from: '+15550000000' };
    const req = twilio.buildRequest(wa, cfg);
    expect(req.url).toContain('/Accounts/AC1/Messages.json');
    expect(req.headers.Authorization).toMatch(/^Basic /);
    expect(req.body).toContain(encodeURIComponent('whatsapp:+966512345678'));
    expect(req.body).toContain(encodeURIComponent('whatsapp:+15550000000'));
  });
});

describe('response parsing', () => {
  it('reads success and failure shapes per provider', () => {
    expect(unifonic.parseResponse(200, '{"success":"true","data":{"MessageID":"m1"}}')).toEqual({
      ok: true,
      id: 'm1',
    });
    expect(unifonic.parseResponse(200, '{"success":"false","message":"bad"}').ok).toBe(false);
    expect(msegat.parseResponse(200, '{"code":"1","id":"x"}')).toEqual({ ok: true, id: 'x' });
    expect(msegat.parseResponse(200, '{"code":"-1","message":"no balance"}').ok).toBe(false);
    expect(twilio.parseResponse(201, '{"sid":"SM1"}')).toEqual({ ok: true, id: 'SM1' });
    expect(twilio.parseResponse(400, '{"message":"invalid"}').ok).toBe(false);
  });
});

describe('sendViaProvider', () => {
  it('mock records the message and never hits the network', async () => {
    const onMock = vi.fn();
    const res = await sendViaProvider('mock', sms, {}, { onMock });
    expect(res.ok).toBe(true);
    expect(onMock).toHaveBeenCalledWith(sms);
  });

  it('drives a real provider through an injected fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('{"code":"1","id":"abc"}'),
    });
    const res = await sendViaProvider('msegat', sms, { apiKey: 'K' }, { fetch: fetchMock as never });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(res).toEqual({ ok: true, id: 'abc' });
  });

  it('reports unknown providers without throwing', async () => {
    const res = await sendViaProvider('nope' as never, sms, {});
    expect(res.ok).toBe(false);
  });

  it('sendOrThrow rejects on a failed send (so retry can catch it)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 500,
      text: () => Promise.resolve('{"code":"-1"}'),
    });
    await expect(
      sendOrThrow('msegat', sms, { apiKey: 'K' }, { fetch: fetchMock as never })
    ).rejects.toThrow();
  });
});
